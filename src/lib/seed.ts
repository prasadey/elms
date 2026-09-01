import { getDb, isSeeded, markSeeded } from "./db";

interface SeedUser {
  name: string;
  email: string;
  role: "EMPLOYEE" | "MANAGER" | "HR";
  department: string;
  managerEmail: string | null;
  password?: string;
}

const SEED_USERS: SeedUser[] = [
  { name: "Chandu", email: "chandu@especiallyyours.com", role: "MANAGER", department: "Management", managerEmail: null, password: "Password123!" },
  { name: "Srihari", email: "srihari@especiallyyours.com", role: "HR", department: "Human Resources", managerEmail: null, password: "Password123!" },
  { name: "Undapalli Ramakrishna", email: "dropship@especiallyyours.com", role: "EMPLOYEE", department: "E-commerce", managerEmail: "chandu@especiallyyours.com", password: "Password123!" },
  { name: "Durga Prasad", email: "durgaprasad@especiallyyours.com", role: "EMPLOYEE", department: "E-commerce", managerEmail: "chandu@especiallyyours.com", password: "Password123!" },
  { name: "Pampana Ramakrishna Prasad", email: "prasad@especiallyyours.com", role: "EMPLOYEE", department: "E-commerce", managerEmail: "chandu@especiallyyours.com", password: "Password123!" },
  { name: "Ravi", email: "ravi@especiallyyours.com", role: "EMPLOYEE", department: "Finance", managerEmail: "chandu@especiallyyours.com", password: "Password123!" },
  { name: "Sandeep", email: "sandeep@especiallyyours.com", role: "EMPLOYEE", department: "Finance", managerEmail: "chandu@especiallyyours.com", password: "Password123!" },
];

interface SeedLeaveType {
  code: string;
  name: string;
  annual_quota: number | null;
  accrual_rule: string;
  carry_forward_cap: number | null;
  requires_document: number;
  half_day_allowed: number;
  backdate_days: number;
  min_notice_days: number;
  min_unit: number;
}

const SEED_LEAVE_TYPES: SeedLeaveType[] = [
  { code: "CL", name: "Casual Leave", annual_quota: 12, accrual_rule: "1/month", carry_forward_cap: 0, requires_document: 0, half_day_allowed: 1, backdate_days: 0, min_notice_days: 0, min_unit: 0.5 },
  { code: "SL", name: "Sick Leave", annual_quota: 6, accrual_rule: "credited upfront", carry_forward_cap: 0, requires_document: 1, half_day_allowed: 1, backdate_days: 7, min_notice_days: 0, min_unit: 0.5 },
  { code: "EL", name: "Earned / Privilege Leave", annual_quota: 15, accrual_rule: "1.25/month", carry_forward_cap: 30, requires_document: 0, half_day_allowed: 1, backdate_days: 0, min_notice_days: 7, min_unit: 0.5 },
  { code: "LOP", name: "Loss of Pay", annual_quota: null, accrual_rule: "N/A", carry_forward_cap: null, requires_document: 0, half_day_allowed: 0, backdate_days: 0, min_notice_days: 0, min_unit: 1 },
  { code: "CO", name: "Compensatory Off", annual_quota: 0, accrual_rule: "on approval of overtime", carry_forward_cap: null, requires_document: 0, half_day_allowed: 0, backdate_days: 0, min_notice_days: 0, min_unit: 1 },
  { code: "ML", name: "Maternity Leave", annual_quota: 182, accrual_rule: "statutory", carry_forward_cap: null, requires_document: 0, half_day_allowed: 0, backdate_days: 0, min_notice_days: 0, min_unit: 1 },
  { code: "PL", name: "Paternity Leave", annual_quota: 5, accrual_rule: "statutory", carry_forward_cap: null, requires_document: 0, half_day_allowed: 0, backdate_days: 0, min_notice_days: 0, min_unit: 1 },
];

const SEED_HOLIDAYS_2026: { date: string; name: string }[] = [
  { date: "2026-01-26", name: "Republic Day" },
  { date: "2026-08-15", name: "Independence Day" },
  { date: "2026-10-02", name: "Gandhi Jayanti" },
];

export function ensureSeeded() {
  if (isSeeded()) return;
  const db = getDb();

  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (userCount.c === 0) {
    const insertUser = db.prepare(
      `INSERT INTO users (name, email, password, role, department, manager_id, date_of_joining, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`
    );
    const emailToId = new Map<string, number>();

    // Insert managers/HR (no manager_id) first, then employees.
    for (const u of SEED_USERS.filter((u) => u.managerEmail === null)) {
      const info = insertUser.run(u.name, u.email, u.password ?? "Password123!", u.role, u.department, null, "2024-01-01");
      emailToId.set(u.email, Number(info.lastInsertRowid));
    }
    for (const u of SEED_USERS.filter((u) => u.managerEmail !== null)) {
      const managerId = emailToId.get(u.managerEmail!) ?? null;
      const info = insertUser.run(u.name, u.email, u.password ?? "Password123!", u.role, u.department, managerId, "2024-01-01");
      emailToId.set(u.email, Number(info.lastInsertRowid));
    }
  } else {
    // Ensure all existing users have password set
    db.prepare("UPDATE users SET password = 'Password123!' WHERE password IS NULL OR password = ''").run();
  }

  const typeCount = db.prepare("SELECT COUNT(*) as c FROM leave_types").get() as { c: number };
  if (typeCount.c === 0) {
    const insertType = db.prepare(
      `INSERT INTO leave_types (code, name, annual_quota, accrual_rule, carry_forward_cap, requires_document, half_day_allowed, backdate_days, min_notice_days, min_unit, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    );
    for (const t of SEED_LEAVE_TYPES) {
      insertType.run(
        t.code, t.name, t.annual_quota, t.accrual_rule, t.carry_forward_cap,
        t.requires_document, t.half_day_allowed, t.backdate_days, t.min_notice_days, t.min_unit
      );
    }
  }

  const holidayCount = db.prepare("SELECT COUNT(*) as c FROM holidays").get() as { c: number };
  if (holidayCount.c === 0) {
    const insertHoliday = db.prepare(`INSERT INTO holidays (date, name, applies_to) VALUES (?, ?, 'all')`);
    for (const h of SEED_HOLIDAYS_2026) {
      insertHoliday.run(h.date, h.name);
    }
  }

  const balanceCount = db.prepare("SELECT COUNT(*) as c FROM leave_balances").get() as { c: number };
  if (balanceCount.c === 0) {
    const users = db.prepare("SELECT id FROM users").all() as { id: number }[];
    const types = db.prepare("SELECT id, annual_quota FROM leave_types").all() as { id: number; annual_quota: number | null }[];
    const insertBalance = db.prepare(
      `INSERT OR IGNORE INTO leave_balances (user_id, leave_type_id, leave_year, entitled, used, on_hold, adjusted)
       VALUES (?, ?, 2026, ?, 0, 0, 0)`
    );
    for (const u of users) {
      for (const t of types) {
        insertBalance.run(u.id, t.id, t.annual_quota ?? 0);
      }
    }
  }

  markSeeded();
}
