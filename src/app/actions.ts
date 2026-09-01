"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/authz";
import { writeAudit } from "@/lib/audit";
import {
  applyLeave,
  decideApproval,
  cancelRequest,
  revokeRequest,
  adjustBalance,
  ApplyLeaveInput,
  ValidationError,
  InsufficientBalanceError,
  OverlapError,
} from "@/lib/leave-service";
import { ForbiddenError, UnauthorizedError } from "@/lib/authz";
import type { HalfDayFlag } from "@/lib/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      code?: "INSUFFICIENT_BALANCE" | "OVERLAP" | "FORBIDDEN" | "VALIDATION" | "UNKNOWN";
      meta?: Record<string, unknown>;
    };

function handleError(err: unknown): ActionResult<never> {
  if (err instanceof InsufficientBalanceError) {
    return {
      ok: false,
      error: err.message,
      code: "INSUFFICIENT_BALANCE",
      meta: { leaveTypeCode: err.leaveTypeCode, available: err.available, requested: err.requested },
    };
  }
  if (err instanceof OverlapError) {
    return { ok: false, error: err.message, code: "OVERLAP", meta: { conflictingRef: err.conflictingRef } };
  }
  if (err instanceof ForbiddenError || err instanceof UnauthorizedError) {
    return { ok: false, error: err.message, code: "FORBIDDEN" };
  }
  if (err instanceof ValidationError) {
    return { ok: false, error: err.message, code: "VALIDATION" };
  }
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again.", code: "UNKNOWN" };
}

export async function applyLeaveAction(input: ApplyLeaveInput): Promise<ActionResult<{ requestRef: string }>> {
  try {
    const user = await requireUser();
    const req = await applyLeave(user, input);
    revalidatePath("/dashboard");
    revalidatePath("/approvals");
    return { ok: true, data: { requestRef: req.request_ref } };
  } catch (err) {
    return handleError(err);
  }
}

export async function decideApprovalAction(
  requestId: number,
  decision: "APPROVED" | "REJECTED",
  comment: string | null
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await decideApproval(user, requestId, decision, comment);
    revalidatePath("/approvals");
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (err) {
    return handleError(err);
  }
}

export async function cancelRequestAction(requestId: number): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await cancelRequest(user, requestId);
    revalidatePath("/dashboard");
    revalidatePath("/approvals");
    return { ok: true, data: undefined };
  } catch (err) {
    return handleError(err);
  }
}

export async function revokeRequestAction(requestId: number, reason: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await revokeRequest(user, requestId, reason);
    revalidatePath("/hr/requests");
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (err) {
    return handleError(err);
  }
}

export async function adjustBalanceAction(
  userId: number,
  leaveTypeId: number,
  year: number,
  delta: number,
  reason: string
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    adjustBalance(user, userId, leaveTypeId, year, delta, reason);
    revalidatePath("/hr/users");
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (err) {
    return handleError(err);
  }
}

export async function markNotificationReadAction(notificationId: number): Promise<ActionResult> {
  try {
    const user = await requireUser();
    getDb()
      .prepare("UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ? AND read_at IS NULL")
      .run(notificationId, user.id);
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (err) {
    return handleError(err);
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    getDb()
      .prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL")
      .run(user.id);
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (err) {
    return handleError(err);
  }
}

export async function addHolidayAction(date: string, name: string): Promise<ActionResult> {
  try {
    const user = await requireRole("HR");
    if (!date || !name.trim()) return { ok: false, error: "Date and name are required.", code: "VALIDATION" };
    const db = getDb();
    const info = db.prepare("INSERT INTO holidays (date, name, applies_to) VALUES (?, ?, 'all')").run(date, name.trim());
    writeAudit({
      entityType: "holiday",
      entityId: Number(info.lastInsertRowid),
      actorId: user.id,
      actorRole: user.role,
      action: "HOLIDAY_ADDED",
      afterState: { date, name: name.trim() },
    });
    revalidatePath("/hr/holidays");
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (err) {
    return handleError(err);
  }
}

export async function removeHolidayAction(id: number): Promise<ActionResult> {
  try {
    const user = await requireRole("HR");
    const db = getDb();
    const row = db.prepare("SELECT * FROM holidays WHERE id = ?").get(id);
    db.prepare("DELETE FROM holidays WHERE id = ?").run(id);
    writeAudit({
      entityType: "holiday",
      entityId: id,
      actorId: user.id,
      actorRole: user.role,
      action: "HOLIDAY_REMOVED",
      beforeState: row,
    });
    revalidatePath("/hr/holidays");
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (err) {
    return handleError(err);
  }
}

export async function setUserStatusAction(userId: number, status: "ACTIVE" | "INACTIVE"): Promise<ActionResult> {
  try {
    const user = await requireRole("HR");
    const db = getDb();
    const before = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, userId);
    writeAudit({
      entityType: "user",
      entityId: userId,
      actorId: user.id,
      actorRole: user.role,
      action: status === "ACTIVE" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      beforeState: before,
      afterState: { status },
    });
    revalidatePath("/hr/users");
    return { ok: true, data: undefined };
  } catch (err) {
    return handleError(err);
  }
}

export async function addUserAction(
  name: string,
  email: string,
  role: "EMPLOYEE" | "MANAGER" | "HR",
  department: string,
  managerId: number | null,
  password?: string
): Promise<ActionResult> {
  try {
    const actor = await requireRole("HR");
    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim() || !cleanEmail.endsWith("@especiallyyours.com")) {
      return { ok: false, error: "Name and an @especiallyyours.com email are required.", code: "VALIDATION" };
    }
    const db = getDb();
    const userPassword = password && password.trim() ? password.trim() : "Password123!";
    const info = db
      .prepare(
        `INSERT INTO users (name, email, password, role, department, manager_id, date_of_joining, status)
         VALUES (?, ?, ?, ?, ?, ?, date('now'), 'ACTIVE')`
      )
      .run(name.trim(), cleanEmail, userPassword, role, department, managerId);
    writeAudit({
      entityType: "user",
      entityId: Number(info.lastInsertRowid),
      actorId: actor.id,
      actorRole: actor.role,
      action: "USER_ADDED",
      afterState: { name, email: cleanEmail, role, department },
    });
    revalidatePath("/hr/users");
    return { ok: true, data: undefined };
  } catch (err) {
    return handleError(err);
  }
}

export async function updateLeaveTypeAction(
  leaveTypeId: number,
  annualQuota: number | null,
  carryForwardCap: number | null,
  active: boolean
): Promise<ActionResult> {
  try {
    const user = await requireRole("HR");
    const db = getDb();
    const before = db.prepare("SELECT * FROM leave_types WHERE id = ?").get(leaveTypeId);
    db.prepare("UPDATE leave_types SET annual_quota = ?, carry_forward_cap = ?, active = ? WHERE id = ?").run(
      annualQuota,
      carryForwardCap,
      active ? 1 : 0,
      leaveTypeId
    );
    writeAudit({
      entityType: "leave_type",
      entityId: leaveTypeId,
      actorId: user.id,
      actorRole: user.role,
      action: "LEAVE_TYPE_UPDATED",
      beforeState: before,
      afterState: { annualQuota, carryForwardCap, active },
    });
    revalidatePath("/hr/leave-types");
    return { ok: true, data: undefined };
  } catch (err) {
    return handleError(err);
  }
}

export type { HalfDayFlag };
