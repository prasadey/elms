export type Role = "EMPLOYEE" | "MANAGER" | "HR";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: Role;
  department: string | null;
  manager_id: number | null;
  date_of_joining: string | null;
  status: UserStatus;
  created_at: string;
}

export interface LeaveType {
  id: number;
  code: string;
  name: string;
  annual_quota: number | null;
  accrual_rule: string | null;
  carry_forward_cap: number | null;
  requires_document: number;
  half_day_allowed: number;
  backdate_days: number;
  min_notice_days: number;
  min_unit: number;
  active: number;
}

export interface LeaveBalance {
  id: number;
  user_id: number;
  leave_type_id: number;
  leave_year: number;
  entitled: number;
  used: number;
  on_hold: number;
  adjusted: number;
}

export type RequestStatus =
  | "PENDING_MANAGER"
  | "PENDING_HR"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REVOKED";

export type HalfDayFlag = "NONE" | "FIRST_HALF" | "SECOND_HALF";

export interface LeaveRequest {
  id: number;
  request_ref: string;
  user_id: number;
  leave_type_id: number;
  from_date: string;
  to_date: string;
  half_day_flag: HalfDayFlag;
  working_days: number;
  reason: string;
  contact_number: string | null;
  attachment_name: string | null;
  converted_to_lop: number;
  status: RequestStatus;
  single_stage: number;
  approver_stage1_id: number | null;
  approver_stage2_id: number | null;
  submitted_at: string;
  decided_at: string | null;
}

export interface Approval {
  id: number;
  request_id: number;
  stage: "MANAGER" | "HR";
  approver_id: number;
  decision: "APPROVED" | "REJECTED" | "REVOKED";
  comment: string | null;
  decided_at: string;
  delegated: number;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  applies_to: string;
}

export interface Notification {
  id: number;
  user_id: number;
  request_id: number | null;
  template_key: string;
  channel: "EMAIL" | "IN_APP";
  payload: string;
  sent_at: string;
  read_at: string | null;
}

export interface AuditLogEntry {
  id: number;
  entity_type: string;
  entity_id: number;
  actor_id: number | null;
  actor_role: string | null;
  action: string;
  before_state: string | null;
  after_state: string | null;
  comment: string | null;
  ip: string | null;
  created_at: string;
}
