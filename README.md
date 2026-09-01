# ELMS — Especiallyyours Leave Management System

A private, internal-only leave application/approval/audit system, built against
the ELMS PRD (v1.0 draft, 5 Aug 2026). Implements the full Phase 1 scope end to
end: authentication + domain restriction, user seeding, apply leave, two-stage
approval (Manager → HR), email + in-app notifications, balances, and an
append-only audit log. Several Phase 2/3 items (HR self-service config,
reports, holiday calendar) are also included since they were small enough to
build alongside Phase 1.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. You'll land on `/login`, which lists the 7 seeded
users — click any name to sign in as them (see **Dev-mode sign-in** below).

The SQLite database is created automatically on first run at `data/elms.db`
and seeded with the 7 users, leave types, a few national holidays, and 2026
balances (see `src/lib/seed.ts`). The `data/` folder is gitignored. Delete it
and restart the server to reset to a clean seeded state.

## Tech stack

- **Next.js 16** (App Router, Server Actions) + TypeScript + Tailwind.
- **`node:sqlite`** (Node's built-in SQLite module, no native deps to compile)
  as the database, via a hand-written schema in `src/lib/schema.ts`.
- **NextAuth (Auth.js) v5**, JWT session strategy, currently wired to a
  dev-mode Credentials provider — see below for swapping in real Google SSO.

This is a deliberate departure from the PRD's suggested options (§15) toward a
conventional stack, since it needed to run standalone in this environment
without provisioning external infra (a managed Postgres, an Apps Script
project, etc.). Everything is self-contained in this one Next.js app.

## Dev-mode sign-in — read before you assume this is production-ready

**The PRD requires real Google Workspace SSO restricted to `@especiallyyours.com`
(§9.1). That is not wired up yet**, because it needs a Google Cloud OAuth
2.0 client ID/secret for the especiallyyours.com Workspace, which wasn't
available while building this. In its place, `/login` lists the seeded users
and lets you sign in as any of them with one click — no password.

This is clearly labeled on the login page itself so nobody mistakes it for
the real thing. Everything downstream of authentication — role checks,
ownership checks, the domain allowlist logic, session cookies/expiry — is
already built the way the PRD specifies; only the identity-proving step is
stubbed.

### Swapping in real Google SSO

1. In Google Cloud Console, create an OAuth 2.0 Client ID (Web application),
   restricted to the especiallyyours.com Workspace. Add
   `http://localhost:3000/api/auth/callback/google` (and your real deploy
   URL's equivalent) as an authorized redirect URI.
2. Add to `.env.local`:
   ```
   AUTH_GOOGLE_ID=...
   AUTH_GOOGLE_SECRET=...
   ```
3. In `src/auth.ts`, add the Google provider alongside (or instead of) the
   `dev-directory` Credentials provider:
   ```ts
   import Google from "next-auth/providers/google";
   // ...
   providers: [
     Google({ authorization: { params: { hd: "especiallyyours.com" } } }),
     // Credentials({ ... }) — remove once Google is confirmed working
   ],
   ```
4. In the `signIn` callback (add one if it doesn't exist), enforce the domain
   **server-side against the verified `hd` claim**, and check the allowlist —
   the exact same checks already in `authorize()` today:
   ```ts
   async signIn({ profile }) {
     if (profile?.hd !== "especiallyyours.com") return false;
     const db = getDb();
     const user = db.prepare("SELECT * FROM users WHERE email = ? AND status = 'ACTIVE'").get(profile?.email);
     return Boolean(user);
   }
   ```
5. Delete the `/login` user-picker UI (or gate it behind `NODE_ENV !== "production"`).

Nothing else changes — the `jwt`/`session` callbacks, role/department
propagation, and every downstream authorization check are provider-agnostic.

## Scope decisions and known simplifications

These are places where the PRD was ambiguous, open, or where a full
implementation was out of proportion for this build. Each is a deliberate,
documented choice, not an oversight:

- **§12.1 — Chandu's department.** Left as "Management" (not one of the two
  operating departments). Confirm with Chandu/Srihari and update via
  `/hr/users` if wrong.
- **§12.4 — Opening 2026 balances.** No existing balances were provided, so
  everyone is seeded at full annual entitlement for 2026 (used=0, on_hold=0).
  HR should correct these via **Adjust balance** on `/hr/users` once real
  carried-in balances are known.
- **§12.6 — Holiday calendar.** Only fixed-date national holidays (Republic
  Day, Independence Day, Gandhi Jayanti) are seeded — movable festival dates
  weren't guessed to avoid seeding wrong ones. Add the rest via `/hr/holidays`.
- **§4 negative-balance handling.** When a request exceeds the available
  balance, the employee is offered to convert *the whole request* to Loss of
  Pay (not a partial split across two leave types) — shown clearly before
  they confirm, per the PRD's UX requirement, just scoped to whole-request
  conversion rather than day-level splitting.
- **§7.2 attachments.** The apply-leave form captures the attachment's file
  name and enforces the "required for SL 3+ days" rule, but does not yet
  store the file itself (no object storage/signed-URL provider configured).
  Wiring an upload target (e.g. S3-compatible bucket) is a small, isolated
  addition to `applyLeave()` in `src/lib/leave-service.ts`.
- **§5.3 reminders.** The 3-day pending-reminder is surfaced as an ageing
  indicator in the approver inbox and in the HR reports page, rather than a
  scheduled push notification — there's no cron/scheduler in this deployment
  shape. Wiring a scheduled job (e.g. Vercel Cron) to call a small
  "send reminders" function is straightforward to add.
- **§10 email.** Outbound email is logged via a stub (`src/lib/mailer.ts`)
  rather than sent, since no SMTP/transactional-email credentials were
  configured. In-app notifications are fully functional. See the comment in
  that file for how to wire real SMTP in one place.
- **§10 Drive archival.** Not implemented — it requires a Google Drive
  service account/OAuth grant. The application database is already the
  authoritative system of record per the PRD's own framing; the CSV exports
  under `/hr/reports` and `/api/export/*` cover the "get data out" need in
  the meantime.
- **§10 PDF export.** Only CSV export is implemented (HR: leave register;
  employees: their own history). PDF was deprioritized as a redundant format
  for the same underlying data.

## Roles and login for testing

| Name | Email | Role |
|---|---|---|
| Chandu | chandu@especiallyyours.com | Manager (Stage 1 approver for all employees) |
| Srihari | srihari@especiallyyours.com | HR (Stage 2 approver for all; also HR console) |
| Undapalli Ramakrishna | dropship@especiallyyours.com | Employee |
| Durga Prasad | durgaprasad@especiallyyours.com | Employee |
| Pampana Ramakrishna Prasad | prasad@especiallyyours.com | Employee |
| Ravi | ravi@especiallyyours.com | Employee |
| Sandeep | sandeep@especiallyyours.com | Employee |

Chandu's own requests route straight to Srihari (single-stage); Srihari's own
requests route straight to Chandu (single-stage) — this is enforced in
`routeApprovals()` in `src/lib/leave-service.ts`, and self-approval is
blocked at the data layer (`decideApproval()`) regardless of what any UI
shows.

## Project structure

- `src/lib/schema.ts`, `src/lib/db.ts` — SQLite schema + connection singleton.
- `src/lib/seed.ts` — one-time seed of users/leave types/holidays/balances.
- `src/lib/leave-service.ts` — all business rules: working-day calculation,
  approval routing, balance holds/settlement, cancel/revoke, audit logging.
- `src/lib/notify.ts` — the notification template set (verbatim from PRD §6.2)
  and in-app/email dispatch.
- `src/auth.ts` — authentication config (see "Dev-mode sign-in" above).
- `src/app/actions.ts` — server actions wrapping the business logic with
  auth/role checks, called directly from client components.
- `src/app/*` — pages: dashboard, apply, approvals (approver inbox), and the
  `/hr` console (users, leave types, holidays, audit log, reports).

## Commands

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run lint     # ESLint
npx tsc --noEmit # type-check
```
