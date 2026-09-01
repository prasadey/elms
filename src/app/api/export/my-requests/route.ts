import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await requireUser();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT lr.request_ref, lt.code as leave_type, lr.from_date, lr.to_date, lr.working_days, lr.status, lr.submitted_at
       FROM leave_requests lr JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE lr.user_id = ?
       ORDER BY lr.from_date DESC`
    )
    .all(user.id) as Record<string, unknown>[];

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="my-leave-history.csv"`,
    },
  });
}
