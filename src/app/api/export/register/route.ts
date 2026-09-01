import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { todayIST } from "@/lib/dates";

export async function GET(req: NextRequest) {
  try {
    await requireRole("HR");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const year = req.nextUrl.searchParams.get("year") ?? todayIST().slice(0, 4);
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT lr.request_ref, u.name as employee, u.department, lt.code as leave_type,
              lr.from_date, lr.to_date, lr.working_days, lr.status, lr.submitted_at, lr.decided_at
       FROM leave_requests lr JOIN users u ON u.id = lr.user_id JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE strftime('%Y', lr.from_date) = ?
       ORDER BY lr.from_date`
    )
    .all(String(year)) as Record<string, unknown>[];

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="leave-register-${year}.csv"`,
    },
  });
}
