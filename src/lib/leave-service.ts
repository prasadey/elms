import { getDb } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { todayIST, isWeekend, eachDate, yearOf, addDays } from "@/lib/dates";
import type {
  User,
  LeaveType,
  LeaveRequest,
  LeaveBalance,
  HalfDayFlag,
  RequestStatus,
} from "@/lib/types";
import type { SessionUser } from "@/lib/authz";
import { ForbiddenError } from "@/lib/authz";

export class ValidationError extends Error {
  status = 400;
}

export class OverlapError extends ValidationError {
  constructor(public conflictingRef: string) {
    super(`These dates overlap an existing request (${conflictingRef}).`);
  }
}

export class InsufficientBalanceError extends ValidationError {
  constructor(
    public leaveTypeCode: string,
    public available: number,
    public requested: number
  ) {
    super(
      `Insufficient ${leaveTypeCode} balance: ${available} day(s) available, ${requested} requested.`
    );
  }
}

function db() {
  return getDb();
}

function getUser(id: number): User {
  const u = db().prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
  if (!u) throw new ValidationError("User not found");
  return u;
}

function getLeaveType(id: number): LeaveType {
  const t = db().prepare("SELECT * FROM leave_types WHERE id = ?").get(id) as LeaveType | undefined;
  if (!t) throw new ValidationError("Leave type not found");
  return t;
}

function getHrUser(): User {
  const u = db()
    .prepare("SELECT * FROM users WHERE role = 'HR' AND status = 'ACTIVE' ORDER BY id LIMIT 1")
    .get() as User | undefined;
  if (!u) throw new ValidationError("No active HR user configured");
  return u;
}

function getTopManager(): User {
  const u = db()
    .prepare(
      "SELECT * FROM users WHERE role = 'MANAGER' AND manager_id IS NULL AND status = 'ACTIVE' ORDER BY id LIMIT 1"
    )
    .get() as User | undefined;
  if (!u) throw new ValidationError("No top-level manager configured");
  return u;
}

function getHolidaySet(): Set<string> {
  const rows = db().prepare("SELECT date FROM holidays").all() as { date: string }[];
  return new Set(rows.map((r) => r.date));
}

export function computeWorkingDays(
  fromDate: string,
  toDate: string,
  halfDayFlag: HalfDayFlag
): number {
  const holidays = getHolidaySet();
  if (halfDayFlag !== "NONE") {
    if (fromDate !== toDate) {
      throw new ValidationError("Half-day requests must have the same from and to date.");
    }
    if (isWeekend(fromDate) || holidays.has(fromDate)) {
      throw new ValidationError("Cannot take half-day leave on a weekend or company holiday.");
    }
    return 0.5;
  }
  let count = 0;
  for (const d of eachDate(fromDate, toDate)) {
    if (!isWeekend(d) && !holidays.has(d)) count += 1;
  }
  return count;
}

function ensureBalanceRow(userId: number, leaveTypeId: number, year: number): LeaveBalance {
  let row = db()
    .prepare(
      "SELECT * FROM leave_balances WHERE user_id = ? AND leave_type_id = ? AND leave_year = ?"
    )
    .get(userId, leaveTypeId, year) as LeaveBalance | undefined;
  if (!row) {
    const type = getLeaveType(leaveTypeId);
    db()
      .prepare(
        `INSERT INTO leave_balances (user_id, leave_type_id, leave_year, entitled, used, on_hold, adjusted)
         VALUES (?, ?, ?, ?, 0, 0, 0)`
      )
      .run(userId, leaveTypeId, year, type.annual_quota ?? 0);
    row = db()
      .prepare(
        "SELECT * FROM leave_balances WHERE user_id = ? AND leave_type_id = ? AND leave_year = ?"
      )
      .get(userId, leaveTypeId, year) as LeaveBalance;
  }
  return row;
}

export function available(bal: LeaveBalance): number {
  return bal.entitled + bal.adjusted - bal.used - bal.on_hold;
}

export function getBalancesForUser(userId: number, year: number) {
  const types = db().prepare("SELECT * FROM leave_types WHERE active = 1").all() as LeaveType[];
  return types.map((t) => {
    const bal = ensureBalanceRow(userId, t.id, year);
    return { type: t, balance: bal, available: available(bal) };
  });
}

function nextRequestRef(year: number): string {
  const row = db()
    .prepare("SELECT COUNT(*) as c FROM leave_requests WHERE request_ref LIKE ?")
    .get(`EY-LV-${year}-%`) as { c: number };
  const seq = String(row.c + 1).padStart(4, "0");
  return `EY-LV-${year}-${seq}`;
}

interface Routing {
  singleStage: boolean;
  stage1ApproverId: number | null;
  stage2ApproverId: number | null;
  initialStatus: RequestStatus;
}

function routeApprovals(requester: User): Routing {
  if (requester.role === "MANAGER") {
    // e.g. Chandu: no manager above him -> single-stage straight to HR.
    const hr = getHrUser();
    return { singleStage: true, stage1ApproverId: null, stage2ApproverId: hr.id, initialStatus: "PENDING_HR" };
  }
  if (requester.role === "HR") {
    // e.g. Srihari: HR's own requests go to the top manager, single-stage.
    const mgr = getTopManager();
    return { singleStage: true, stage1ApproverId: mgr.id, stage2ApproverId: null, initialStatus: "PENDING_MANAGER" };
  }
  // Regular employee: manager (stage 1) then HR (stage 2).
  const hr = getHrUser();
  if (!requester.manager_id) throw new ValidationError("Employee has no manager assigned.");
  return {
    singleStage: false,
    stage1ApproverId: requester.manager_id,
    stage2ApproverId: hr.id,
    initialStatus: "PENDING_MANAGER",
  };
}

export interface ApplyLeaveInput {
  leaveTypeId: number;
  fromDate: string;
  toDate: string;
  halfDayFlag: HalfDayFlag;
  reason: string;
  contactNumber?: string | null;
  attachmentName?: string | null;
  confirmLopConversion?: boolean;
}

export async function applyLeave(actor: SessionUser, input: ApplyLeaveInput): Promise<LeaveRequest> {
  const requester = getUser(actor.id);
  let leaveType = getLeaveType(input.leaveTypeId);
  if (!leaveType.active) throw new ValidationError("Leave type is not active.");

  if (input.reason.trim().length < 10) {
    throw new ValidationError("Reason must be at least 10 characters.");
  }
  if (input.toDate < input.fromDate) {
    throw new ValidationError("To-date cannot be before from-date.");
  }
  if (input.halfDayFlag !== "NONE" && !leaveType.half_day_allowed) {
    throw new ValidationError(`${leaveType.code} does not support half-day requests.`);
  }

  const today = todayIST();
  const earliestAllowed =
    leaveType.backdate_days > 0 ? addDays(today, -leaveType.backdate_days) : today;
  if (input.fromDate < earliestAllowed) {
    if (leaveType.backdate_days > 0) {
      throw new ValidationError(
        `${leaveType.code} can be backdated by at most ${leaveType.backdate_days} day(s).`
      );
    }
    throw new ValidationError("This leave type cannot start before the submission date.");
  }

  const workingDays = computeWorkingDays(input.fromDate, input.toDate, input.halfDayFlag);
  if (workingDays <= 0) {
    throw new ValidationError("This date range has no working days to apply leave against (weekends/holidays only).");
  }

  if (leaveType.min_notice_days > 0 && workingDays >= 3) {
    const minFrom = addDays(today, leaveType.min_notice_days);
    if (input.fromDate < minFrom) {
      throw new ValidationError(
        `${leaveType.code} requires ${leaveType.min_notice_days} days' notice for requests of 3 or more days.`
      );
    }
  }

  if (leaveType.requires_document && workingDays >= 3 && !input.attachmentName) {
    throw new ValidationError(
      `${leaveType.code} requires a supporting document for requests of 3 or more consecutive days.`
    );
  }

  // Overlap check against this user's active requests.
  const conflict = db()
    .prepare(
      `SELECT request_ref FROM leave_requests
       WHERE user_id = ? AND status IN ('PENDING_MANAGER','PENDING_HR','APPROVED')
       AND NOT (to_date < ? OR from_date > ?)
       LIMIT 1`
    )
    .get(requester.id, input.fromDate, input.toDate) as { request_ref: string } | undefined;
  if (conflict) throw new OverlapError(conflict.request_ref);

  const year = yearOf(input.fromDate);
  let convertedToLop = 0;

  if (leaveType.code !== "LOP") {
    const bal = ensureBalanceRow(requester.id, leaveType.id, year);
    const avail = available(bal);
    if (workingDays > avail) {
      if (!input.confirmLopConversion) {
        throw new InsufficientBalanceError(leaveType.code, avail, workingDays);
      }
      // Employee confirmed converting this request to Loss of Pay.
      const lop = db().prepare("SELECT * FROM leave_types WHERE code = 'LOP'").get() as LeaveType;
      leaveType = lop;
      convertedToLop = 1;
    }
  }

  const routing = routeApprovals(requester);
  const ref = nextRequestRef(year);

  const info = db()
    .prepare(
      `INSERT INTO leave_requests
        (request_ref, user_id, leave_type_id, from_date, to_date, half_day_flag, working_days, reason,
         contact_number, attachment_name, converted_to_lop, status, single_stage, approver_stage1_id, approver_stage2_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      ref,
      requester.id,
      leaveType.id,
      input.fromDate,
      input.toDate,
      input.halfDayFlag,
      workingDays,
      input.reason.trim(),
      input.contactNumber ?? null,
      input.attachmentName ?? null,
      convertedToLop,
      routing.initialStatus,
      routing.singleStage ? 1 : 0,
      routing.stage1ApproverId,
      routing.stage2ApproverId
    );
  const requestId = Number(info.lastInsertRowid);

  const bal = ensureBalanceRow(requester.id, leaveType.id, year);
  db()
    .prepare("UPDATE leave_balances SET on_hold = on_hold + ? WHERE id = ?")
    .run(workingDays, bal.id);

  writeAudit({
    entityType: "leave_request",
    entityId: requestId,
    actorId: requester.id,
    actorRole: requester.role,
    action: "SUBMITTED",
    afterState: { status: routing.initialStatus, workingDays, leaveTypeId: leaveType.id },
  });

  const currentApproverId = routing.initialStatus === "PENDING_MANAGER" ? routing.stage1ApproverId : routing.stage2ApproverId;
  const currentApprover = currentApproverId ? getUser(currentApproverId) : null;

  await notify(
    requester,
    "SUBMITTED_EMPLOYEE",
    {
      leave_type: leaveType.name,
      from_date: input.fromDate,
      to_date: input.toDate,
      days: workingDays,
      request_id: ref,
      current_approver_name: currentApprover?.name ?? "",
    },
    requestId,
    `Leave request ${ref} submitted`
  );

  if (currentApprover) {
    await notify(
      currentApprover,
      "SUBMITTED_APPROVER",
      {
        employee_name: requester.name,
        department: requester.department ?? "",
        leave_type: leaveType.name,
        from_date: input.fromDate,
        to_date: input.toDate,
        days: workingDays,
        reason: input.reason.trim(),
        link: `/approvals`,
      },
      requestId,
      `Leave request ${ref} needs your review`
    );
  }

  return db().prepare("SELECT * FROM leave_requests WHERE id = ?").get(requestId) as LeaveRequest;
}

function getRequest(requestId: number): LeaveRequest {
  const r = db().prepare("SELECT * FROM leave_requests WHERE id = ?").get(requestId) as
    | LeaveRequest
    | undefined;
  if (!r) throw new ValidationError("Leave request not found");
  return r;
}

function releaseHold(req: LeaveRequest) {
  const year = yearOf(req.from_date);
  const bal = ensureBalanceRow(req.user_id, req.leave_type_id, year);
  db()
    .prepare("UPDATE leave_balances SET on_hold = on_hold - ? WHERE id = ?")
    .run(req.working_days, bal.id);
}

function settleApproved(req: LeaveRequest) {
  const year = yearOf(req.from_date);
  const bal = ensureBalanceRow(req.user_id, req.leave_type_id, year);
  db()
    .prepare("UPDATE leave_balances SET on_hold = on_hold - ?, used = used + ? WHERE id = ?")
    .run(req.working_days, req.working_days, bal.id);
}

export async function decideApproval(
  actor: SessionUser,
  requestId: number,
  decision: "APPROVED" | "REJECTED",
  comment: string | null
): Promise<LeaveRequest> {
  const req = getRequest(requestId);

  // No self-approval, enforced at the data layer regardless of what the UI shows.
  if (req.user_id === actor.id) {
    throw new ForbiddenError("You cannot approve or reject your own leave request.");
  }
  if (req.status !== "PENDING_MANAGER" && req.status !== "PENDING_HR") {
    throw new ValidationError("This request is not awaiting a decision.");
  }
  if (decision === "REJECTED" && !comment) {
    throw new ValidationError("A comment is required when rejecting.");
  }

  const stage: "MANAGER" | "HR" = req.status === "PENDING_MANAGER" ? "MANAGER" : "HR";
  const expectedApproverId = stage === "MANAGER" ? req.approver_stage1_id : req.approver_stage2_id;

  let delegated = false;
  if (actor.id !== expectedApproverId) {
    // HR may delegate only for a manager who is themselves on approved leave
    // right now (PRD 5.3) — not as a general override of any pending manager.
    const managerOnLeave =
      actor.role === "HR" &&
      stage === "MANAGER" &&
      expectedApproverId !== null &&
      Boolean(
        db()
          .prepare(
            `SELECT 1 FROM leave_requests WHERE user_id = ? AND status = 'APPROVED' AND from_date <= ? AND to_date >= ? LIMIT 1`
          )
          .get(expectedApproverId, todayIST(), todayIST())
      );
    if (managerOnLeave) {
      delegated = true;
    } else {
      throw new ForbiddenError("You are not the assigned approver for this request.");
    }
  }

  const requester = getUser(req.user_id);
  const leaveType = getLeaveType(req.leave_type_id);
  const before = { status: req.status };

  db()
    .prepare(
      `INSERT INTO approvals (request_id, stage, approver_id, decision, comment, delegated) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.id, stage, actor.id, decision, comment, delegated ? 1 : 0);

  let newStatus: RequestStatus;
  if (decision === "REJECTED") {
    newStatus = "REJECTED";
    releaseHold(req);
  } else if (stage === "MANAGER" && !req.single_stage) {
    newStatus = "PENDING_HR";
  } else {
    newStatus = "APPROVED";
    settleApproved(req);
  }

  db()
    .prepare(
      `UPDATE leave_requests SET status = ?, decided_at = CASE WHEN ? IN ('APPROVED','REJECTED') THEN datetime('now') ELSE decided_at END WHERE id = ?`
    )
    .run(newStatus, newStatus, req.id);

  writeAudit({
    entityType: "leave_request",
    entityId: req.id,
    actorId: actor.id,
    actorRole: actor.role,
    action: decision === "REJECTED" ? "REJECTED" : stage === "MANAGER" && !req.single_stage ? "STAGE1_APPROVED" : "FINAL_APPROVED",
    beforeState: before,
    afterState: { status: newStatus, delegated },
    comment: delegated ? `[Delegated by HR for the manager on leave] ${comment ?? ""}`.trim() : comment,
  });

  const approver = getUser(actor.id);

  if (decision === "REJECTED") {
    await notify(
      requester,
      "REJECTED_EMPLOYEE",
      {
        approver_name: approver.name,
        request_id: req.request_ref,
        from_date: req.from_date,
        to_date: req.to_date,
        comment: comment ?? "",
      },
      req.id,
      `Leave request ${req.request_ref} rejected`
    );
  } else if (newStatus === "PENDING_HR") {
    const hr = getUser(req.approver_stage2_id!);
    await notify(
      requester,
      "STAGE1_APPROVED_EMPLOYEE",
      {
        approver_name: approver.name,
        request_id: req.request_ref,
        from_date: req.from_date,
        to_date: req.to_date,
        next_approver_name: hr.name,
      },
      req.id,
      `Leave request ${req.request_ref} approved by manager`
    );
    await notify(
      hr,
      "SUBMITTED_APPROVER",
      {
        employee_name: requester.name,
        department: requester.department ?? "",
        leave_type: leaveType.name,
        from_date: req.from_date,
        to_date: req.to_date,
        days: req.working_days,
        reason: req.reason,
        link: `/approvals`,
      },
      req.id,
      `Leave request ${req.request_ref} needs your review`
    );
  } else if (newStatus === "APPROVED") {
    const year = yearOf(req.from_date);
    const bal = ensureBalanceRow(req.user_id, req.leave_type_id, year);
    await notify(
      requester,
      "FINAL_APPROVED_EMPLOYEE",
      {
        approver_name: approver.name,
        request_id: req.request_ref,
        leave_type: leaveType.name,
        from_date: req.from_date,
        to_date: req.to_date,
        days: req.working_days,
        balance: available(bal),
      },
      req.id,
      `Leave request ${req.request_ref} approved`
    );

    // Notify stage 1 manager if different from final approver (e.g., notify Chandu when HR Srihari approves)
    if (req.approver_stage1_id && req.approver_stage1_id !== actor.id) {
      const manager = getUser(req.approver_stage1_id);
      await notify(
        manager,
        "FINAL_APPROVED_MANAGER",
        {
          approver_name: approver.name,
          request_id: req.request_ref,
          employee_name: requester.name,
          leave_type: leaveType.name,
          from_date: req.from_date,
          to_date: req.to_date,
        },
        req.id,
        `Leave request ${req.request_ref} for ${requester.name} approved by HR`
      );
    }
  }

  return getRequest(req.id);
}

export async function cancelRequest(actor: SessionUser, requestId: number): Promise<LeaveRequest> {
  const req = getRequest(requestId);
  if (req.user_id !== actor.id) throw new ForbiddenError("You can only cancel your own requests.");
  if (req.status !== "PENDING_MANAGER" && req.status !== "PENDING_HR") {
    throw new ValidationError("Only pending requests can be cancelled. Approved leave requires an HR revoke.");
  }

  const before = { status: req.status };
  releaseHold(req);
  db()
    .prepare("UPDATE leave_requests SET status = 'CANCELLED', decided_at = datetime('now') WHERE id = ?")
    .run(req.id);

  writeAudit({
    entityType: "leave_request",
    entityId: req.id,
    actorId: actor.id,
    actorRole: actor.role,
    action: "CANCELLED",
    beforeState: before,
    afterState: { status: "CANCELLED" },
  });

  const currentApproverId = req.status === "PENDING_MANAGER" ? req.approver_stage1_id : req.approver_stage2_id;
  if (currentApproverId) {
    const approver = getUser(currentApproverId);
    const requester = getUser(req.user_id);
    await notify(
      approver,
      "CANCELLED_APPROVER",
      { employee_name: requester.name, request_id: req.request_ref },
      req.id,
      `Leave request ${req.request_ref} cancelled`
    );
  }

  return getRequest(req.id);
}

export async function revokeRequest(
  actor: SessionUser,
  requestId: number,
  reason: string
): Promise<LeaveRequest> {
  if (actor.role !== "HR") throw new ForbiddenError("Only HR can revoke approved leave.");
  if (!reason || reason.trim().length === 0) {
    throw new ValidationError("A reason is required to revoke approved leave.");
  }
  const req = getRequest(requestId);
  if (req.status !== "APPROVED") throw new ValidationError("Only approved requests can be revoked.");

  const before = { status: req.status };
  const year = yearOf(req.from_date);
  const bal = ensureBalanceRow(req.user_id, req.leave_type_id, year);
  db()
    .prepare("UPDATE leave_balances SET used = used - ? WHERE id = ?")
    .run(req.working_days, bal.id);

  db()
    .prepare("UPDATE leave_requests SET status = 'REVOKED', decided_at = datetime('now') WHERE id = ?")
    .run(req.id);

  db()
    .prepare(
      `INSERT INTO approvals (request_id, stage, approver_id, decision, comment) VALUES (?, 'HR', ?, 'REVOKED', ?)`
    )
    .run(req.id, actor.id, reason.trim());

  writeAudit({
    entityType: "leave_request",
    entityId: req.id,
    actorId: actor.id,
    actorRole: actor.role,
    action: "REVOKED",
    beforeState: before,
    afterState: { status: "REVOKED" },
    comment: reason.trim(),
  });

  const requester = getUser(req.user_id);
  const hr = getUser(actor.id);
  await notify(
    requester,
    "REVOKED_NOTICE",
    { hr_name: hr.name, request_id: req.request_ref, comment: reason.trim() },
    req.id,
    `Leave request ${req.request_ref} revoked`
  );
  if (req.approver_stage1_id) {
    const manager = getUser(req.approver_stage1_id);
    await notify(
      manager,
      "REVOKED_NOTICE",
      { hr_name: hr.name, request_id: req.request_ref, comment: reason.trim() },
      req.id,
      `Leave request ${req.request_ref} revoked`
    );
  }

  return getRequest(req.id);
}

export function adjustBalance(
  actor: SessionUser,
  userId: number,
  leaveTypeId: number,
  year: number,
  delta: number,
  reason: string
) {
  if (actor.role !== "HR") throw new ForbiddenError("Only HR can adjust balances.");
  if (!reason || reason.trim().length === 0) {
    throw new ValidationError("A reason is required for balance adjustments.");
  }
  const bal = ensureBalanceRow(userId, leaveTypeId, year);
  db().prepare("UPDATE leave_balances SET adjusted = adjusted + ? WHERE id = ?").run(delta, bal.id);

  writeAudit({
    entityType: "leave_balance",
    entityId: bal.id,
    actorId: actor.id,
    actorRole: actor.role,
    action: "BALANCE_ADJUSTED",
    beforeState: { adjusted: bal.adjusted },
    afterState: { adjusted: bal.adjusted + delta },
    comment: reason.trim(),
  });
}
