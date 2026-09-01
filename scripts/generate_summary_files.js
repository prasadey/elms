const pptxgen = require("pptxgenjs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");
const pdfPath = path.join(rootDir, "ELMS_App_Development_Summary.pdf");
const pptxPath = path.join(rootDir, "ELMS_App_Development_Summary.pptx");
const pdfPath2 = path.join(rootDir, "ELMS_System_Summary_and_Guide.pdf");

// ==========================================
// 1. GENERATE PPTX PRESENTATION
// ==========================================
async function generatePresentation() {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "EspeciallyYours Engineering Team";
  pptx.company = "EspeciallyYours";
  pptx.title = "ELMS - App Development Summary & Operational Guide";
  pptx.subject = "Leave Management System Architecture & User Guide";

  // Brand Colors
  const C_DARK_BG = "0B1120"; // Deep slate
  const C_CARD_BG = "1E293B"; // Slate 800
  const C_CARD_BORDER = "334155"; // Slate 700
  const C_PRIMARY = "4F46E5"; // Indigo 600
  const C_ACCENT = "06B6D4"; // Cyan 500
  const C_TEXT_LIGHT = "F8FAFC"; // White slate
  const C_TEXT_MUTED = "94A3B8"; // Slate 400
  const C_SUCCESS = "10B981"; // Emerald
  const C_WARNING = "F59E0B"; // Amber

  // Helper for slide header
  function addHeader(slide, title, category = "ELMS DEVELOPMENT SUMMARY & GUIDE") {
    // Top banner
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.6,
      y: 0.4,
      w: 12.13,
      h: 0.9,
      fill: { color: C_DARK_BG },
    });
    slide.addText(category.toUpperCase(), {
      x: 0.6,
      y: 0.4,
      w: 12.0,
      h: 0.25,
      fontSize: 10,
      fontFace: "Arial",
      bold: true,
      color: C_ACCENT,
      letterSpacing: 1.5,
    });
    slide.addText(title, {
      x: 0.6,
      y: 0.65,
      w: 12.0,
      h: 0.55,
      fontSize: 22,
      fontFace: "Arial",
      bold: true,
      color: C_TEXT_LIGHT,
    });
  }

  // --- SLIDE 1: Title Slide ---
  {
    const s = pptx.addSlide();
    s.background = { color: C_DARK_BG };

    // Decorative gradient-like accent block
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 1.2,
      w: 11.73,
      h: 5.1,
      rectRadius: 0.2,
      fill: { color: C_CARD_BG },
      line: { color: C_PRIMARY, width: 2 },
    });

    s.addText("ESPECIALLYYOURS INTERNAL SYSTEMS", {
      x: 1.3,
      y: 1.7,
      w: 10.5,
      h: 0.35,
      fontSize: 12,
      fontFace: "Arial",
      bold: true,
      color: C_ACCENT,
      letterSpacing: 2,
    });

    s.addText("Especiallyyours Leave Management System\n(ELMS) — Development & Architecture Summary", {
      x: 1.3,
      y: 2.1,
      w: 10.5,
      h: 1.5,
      fontSize: 28,
      fontFace: "Arial",
      bold: true,
      color: C_TEXT_LIGHT,
      lineSpacing: 34,
    });

    s.addText(
      "A comprehensive, tamper-evident, multi-stage leave management platform with real-time balance calculations, audit trails, and role-based workflows.",
      {
        x: 1.3,
        y: 3.7,
        w: 10.5,
        h: 0.8,
        fontSize: 14,
        fontFace: "Arial",
        color: C_TEXT_MUTED,
        lineSpacing: 18,
      }
    );

    // Metadata badges
    s.addShape(pptx.ShapeType.roundRect, {
      x: 1.3,
      y: 4.8,
      w: 3.2,
      h: 0.9,
      rectRadius: 0.1,
      fill: { color: "0F172A" },
      line: { color: C_CARD_BORDER, width: 1 },
    });
    s.addText("TARGET AUDIENCE\nTeam, Chandu (Mgr), Srihari (HR)", {
      x: 1.4,
      y: 4.9,
      w: 3.0,
      h: 0.7,
      fontSize: 10,
      fontFace: "Arial",
      color: C_TEXT_LIGHT,
      align: "center",
    });

    s.addShape(pptx.ShapeType.roundRect, {
      x: 4.8,
      y: 4.8,
      w: 3.2,
      h: 0.9,
      rectRadius: 0.1,
      fill: { color: "0F172A" },
      line: { color: C_CARD_BORDER, width: 1 },
    });
    s.addText("TECH STACK\nNext.js 16 + SQLite + TypeScript", {
      x: 4.9,
      y: 4.9,
      w: 3.0,
      h: 0.7,
      fontSize: 10,
      fontFace: "Arial",
      color: C_TEXT_LIGHT,
      align: "center",
    });

    s.addShape(pptx.ShapeType.roundRect, {
      x: 8.3,
      y: 4.8,
      w: 3.2,
      h: 0.9,
      rectRadius: 0.1,
      fill: { color: "0F172A" },
      line: { color: C_CARD_BORDER, width: 1 },
    });
    s.addText("RELEASE STATUS\nProduction Ready v1.0", {
      x: 8.4,
      y: 4.9,
      w: 3.0,
      h: 0.7,
      fontSize: 10,
      fontFace: "Arial",
      color: C_SUCCESS,
      bold: true,
      align: "center",
    });
  }

  // --- SLIDE 2: Executive Overview & Objectives ---
  {
    const s = pptx.addSlide();
    s.background = { color: C_DARK_BG };
    addHeader(s, "1. Executive Overview & Purpose", "SYSTEM PURPOSE & MOTIVATION");

    const cards = [
      {
        title: "The Problem Replaced",
        desc: "• Manual, untracked WhatsApp / Email requests\n• Unsynchronized leave balances & human errors\n• Lack of visibility into team schedules\n• Absence of an immutable audit trail",
        color: "EF4444",
      },
      {
        title: "What ELMS Delivers",
        desc: "• Automated 2-stage approval (Manager -> HR)\n• Dynamic working day & holiday auto-exclusion\n• Real-time balance holds & quota enforcement\n• Domain-locked (@especiallyyours.com) security",
        color: C_PRIMARY,
      },
      {
        title: "Key Business Outcomes",
        desc: "• 100% compliance with corporate leave policies\n• Zero duplicate approvals or over-drafted balances\n• Complete auditability for payroll & HR\n• Instant 1-click decision making on any device",
        color: C_SUCCESS,
      },
    ];

    cards.forEach((c, idx) => {
      const x = 0.6 + idx * 4.1;
      s.addShape(pptx.ShapeType.roundRect, {
        x: x,
        y: 1.5,
        w: 3.9,
        h: 4.9,
        rectRadius: 0.15,
        fill: { color: C_CARD_BG },
        line: { color: c.color, width: 1.5 },
      });

      s.addText(c.title, {
        x: x + 0.25,
        y: 1.75,
        w: 3.4,
        h: 0.4,
        fontSize: 16,
        fontFace: "Arial",
        bold: true,
        color: C_TEXT_LIGHT,
      });

      s.addText(c.desc, {
        x: x + 0.25,
        y: 2.3,
        w: 3.4,
        h: 3.8,
        fontSize: 12,
        fontFace: "Arial",
        color: C_TEXT_MUTED,
        lineSpacing: 20,
      });
    });
  }

  // --- SLIDE 3: Architecture & Tech Stack ---
  {
    const s = pptx.addSlide();
    s.background = { color: C_DARK_BG };
    addHeader(s, "2. Modern Architecture & Technology Stack", "TECHNICAL SPECIFICATION");

    const techs = [
      {
        name: "Next.js 16 (App Router + Turbopack)",
        role: "Full-Stack Web Framework",
        desc: "Server-side rendering (SSR), React Server Components (RSC), and Server Actions for high-performance zero-latency data mutations.",
      },
      {
        name: "TypeScript (Strict Mode)",
        role: "Type-Safe Application Layer",
        desc: "End-to-end type safety preventing runtime errors across schemas, API payloads, approval state machines, and calculations.",
      },
      {
        name: "SQLite + DatabaseSync (WAL Mode)",
        role: "Local Embedded High-Speed DB",
        desc: "Write-Ahead Logging (WAL) concurrency, foreign key constraints, atomic transactions for leave balance deductions, and audit logging.",
      },
      {
        name: "NextAuth.js (JWT Sessions)",
        role: "Secure Authentication & Authorization",
        desc: "Domain restricted to @especiallyyours.com, role-based route middleware, tamper-proof session tokens, and instant User-Switcher.",
      },
    ];

    techs.forEach((t, idx) => {
      const row = Math.floor(idx / 2);
      const col = idx % 2;
      const x = 0.6 + col * 6.15;
      const y = 1.5 + row * 2.5;

      s.addShape(pptx.ShapeType.roundRect, {
        x: x,
        y: y,
        w: 5.95,
        h: 2.3,
        rectRadius: 0.15,
        fill: { color: C_CARD_BG },
        line: { color: C_CARD_BORDER, width: 1 },
      });

      s.addText(t.name, {
        x: x + 0.3,
        y: y + 0.2,
        w: 5.35,
        h: 0.35,
        fontSize: 14,
        fontFace: "Arial",
        bold: true,
        color: C_ACCENT,
      });

      s.addText(t.role, {
        x: x + 0.3,
        y: y + 0.55,
        w: 5.35,
        h: 0.3,
        fontSize: 11,
        fontFace: "Arial",
        bold: true,
        color: C_TEXT_LIGHT,
      });

      s.addText(t.desc, {
        x: x + 0.3,
        y: y + 0.9,
        w: 5.35,
        h: 1.2,
        fontSize: 11,
        fontFace: "Arial",
        color: C_TEXT_MUTED,
        lineSpacing: 16,
      });
    });
  }

  // --- SLIDE 4: User Accounts & Roles Matrix ---
  {
    const s = pptx.addSlide();
    s.background = { color: C_DARK_BG };
    addHeader(s, "3. Seeded Accounts & Organizational Roster", "ACCESS CONTROL MATRIX");

    const headers = ["Name", "Email Address", "System Role", "Department", "Reports To"];
    const rows = [
      ["Chandu", "chandu@especiallyyours.com", "MANAGER", "Management", "None (Top Mgr)"],
      ["Srihari", "srihari@especiallyyours.com", "HR ADMIN", "Human Resources", "None (HR Admin)"],
      ["Undapalli Ramakrishna", "dropship@especiallyyours.com", "EMPLOYEE", "E-commerce", "Chandu"],
      ["Durga Prasad", "durgaprasad@especiallyyours.com", "EMPLOYEE", "E-commerce", "Chandu"],
      ["Pampana Ramakrishna Prasad", "prasad@especiallyyours.com", "EMPLOYEE", "E-commerce", "Chandu"],
      ["Ravi", "ravi@especiallyyours.com", "EMPLOYEE", "Finance", "Chandu"],
      ["Sandeep", "sandeep@especiallyyours.com", "EMPLOYEE", "Finance", "Chandu"],
    ];

    const tableData = [
      headers.map((h) => ({
        text: h,
        options: { bold: true, fill: C_PRIMARY, color: "FFFFFF", fontSize: 10, align: "center" },
      })),
      ...rows.map((r, rIdx) =>
        r.map((cell, cIdx) => ({
          text: cell,
          options: {
            fill: rIdx % 2 === 0 ? C_CARD_BG : "172033",
            color: cIdx === 2 ? (cell === "MANAGER" ? C_ACCENT : cell === "HR ADMIN" ? C_SUCCESS : C_TEXT_LIGHT) : C_TEXT_LIGHT,
            fontSize: 9.5,
            bold: cIdx === 0 || cIdx === 2,
          },
        }))
      ),
    ];

    s.addTable(tableData, {
      x: 0.6,
      y: 1.5,
      w: 12.13,
      rowH: 0.45,
      border: { pt: 1, color: C_CARD_BORDER },
      colW: [2.8, 3.2, 1.8, 2.2, 2.13],
    });

    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y: 5.4,
      w: 12.13,
      h: 1.1,
      rectRadius: 0.1,
      fill: { color: "111E38" },
      line: { color: C_ACCENT, width: 1 },
    });

    s.addText("KEY ACCESS & TESTING HIGHLIGHTS", {
      x: 0.8,
      y: 5.5,
      w: 11.7,
      h: 0.25,
      fontSize: 10,
      fontFace: "Arial",
      bold: true,
      color: C_ACCENT,
    });

    s.addText(
      "• Universal Default Password: Password123! for all initial accounts.\n• 1-Click Quick Demo Login buttons on /login page & instant Top Navigation Switcher for rapid role preview.\n• Strict domain restriction: Only @especiallyyours.com email addresses are authorized to register or login.",
      {
        x: 0.8,
        y: 5.75,
        w: 11.7,
        h: 0.65,
        fontSize: 10,
        fontFace: "Arial",
        color: C_TEXT_LIGHT,
        lineSpacing: 15,
      }
    );
  }

  // --- SLIDE 5: Approval Workflow & Routing Rules ---
  {
    const s = pptx.addSlide();
    s.background = { color: C_DARK_BG };
    addHeader(s, "4. Two-Stage Approval Routing & Decision Flow", "WORKFLOW ENGINE");

    const steps = [
      {
        num: "01",
        title: "Leave Submission",
        actor: "Any Employee",
        desc: "• Select leave type, dates, half-day option\n• Automatic exclusion of weekends & company holidays\n• Instant Hold placed on leave balance\n• Status -> PENDING_MANAGER",
        color: C_ACCENT,
      },
      {
        num: "02",
        title: "Stage 1: Manager Review",
        actor: "Chandu (Manager)",
        desc: "• Reviews team schedule & reason\n• Action: APPROVE -> Passes to Stage 2 (PENDING_HR)\n• Action: REJECT -> Releases balance hold immediately\n• Protected: Cannot approve own leave",
        color: C_PRIMARY,
      },
      {
        num: "03",
        title: "Stage 2: HR Final Sign-off",
        actor: "Srihari (HR Admin)",
        desc: "• Verifies policy compliance & documentation\n• Action: APPROVE -> Status APPROVED, converts hold into used deduction\n• Action: REJECT -> Releases balance hold\n• Power to Revoke approved leave with audit reason",
        color: C_SUCCESS,
      },
    ];

    steps.forEach((st, idx) => {
      const x = 0.6 + idx * 4.1;
      s.addShape(pptx.ShapeType.roundRect, {
        x: x,
        y: 1.5,
        w: 3.9,
        h: 5.0,
        rectRadius: 0.15,
        fill: { color: C_CARD_BG },
        line: { color: st.color, width: 2 },
      });

      s.addText(st.num, {
        x: x + 0.25,
        y: 1.7,
        w: 1.0,
        h: 0.4,
        fontSize: 22,
        fontFace: "Arial",
        bold: true,
        color: st.color,
      });

      s.addText(st.title, {
        x: x + 0.25,
        y: 2.1,
        w: 3.4,
        h: 0.35,
        fontSize: 15,
        fontFace: "Arial",
        bold: true,
        color: C_TEXT_LIGHT,
      });

      s.addText("ACTOR: " + st.actor.toUpperCase(), {
        x: x + 0.25,
        y: 2.45,
        w: 3.4,
        h: 0.25,
        fontSize: 10,
        fontFace: "Arial",
        bold: true,
        color: C_WARNING,
      });

      s.addText(st.desc, {
        x: x + 0.25,
        y: 2.8,
        w: 3.4,
        h: 3.4,
        fontSize: 11.5,
        fontFace: "Arial",
        color: C_TEXT_MUTED,
        lineSpacing: 19,
      });
    });
  }

  // --- SLIDE 6: Leave Policy & Rules Engine ---
  {
    const s = pptx.addSlide();
    s.background = { color: C_DARK_BG };
    addHeader(s, "5. Leave Policies, Quotas & Accrual Rules", "BUSINESS LOGIC & ENTITLEMENTS");

    const headers = ["Code", "Leave Type", "Quota", "Accrual Logic", "Carry Forward", "Rules & Constraints"];
    const rows = [
      ["CL", "Casual Leave", "12 Days", "1 day / month", "Lapses Dec 31 (0)", "Half-day supported (First / Second half)"],
      ["SL", "Sick Leave", "6 Days", "Credited Upfront", "Lapses Dec 31 (0)", "Backdating <= 7d allowed; Medical Cert if >= 3d"],
      ["EL", "Earned Leave", "15 Days", "1.25 days / month", "Up to 30 Days", "Requires 7 days notice if requesting >= 3 days"],
      ["LOP", "Loss of Pay", "Unlimited", "On Exhaustion", "N/A", "Fallback when balance is 0; payroll flagged"],
      ["CO", "Compensatory Off", "As Earned", "Overtime credit", "90 Days Validity", "Manager logs approved weekend/overtime shift"],
      ["ML/PL", "Maternity / Paternity", "Statutory", "On event", "N/A", "ML: 26 Weeks (182d); PL: 5 Days (within 3m)"],
    ];

    const tableData = [
      headers.map((h) => ({
        text: h,
        options: { bold: true, fill: C_PRIMARY, color: "FFFFFF", fontSize: 9.5, align: "center" },
      })),
      ...rows.map((r, rIdx) =>
        r.map((cell, cIdx) => ({
          text: cell,
          options: {
            fill: rIdx % 2 === 0 ? C_CARD_BG : "172033",
            color: cIdx === 0 ? C_ACCENT : C_TEXT_LIGHT,
            fontSize: 9,
            bold: cIdx === 0,
          },
        }))
      ),
    ];

    s.addTable(tableData, {
      x: 0.6,
      y: 1.5,
      w: 12.13,
      rowH: 0.45,
      border: { pt: 1, color: C_CARD_BORDER },
      colW: [1.0, 2.2, 1.3, 2.0, 1.8, 3.83],
    });

    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y: 5.2,
      w: 12.13,
      h: 1.3,
      rectRadius: 0.1,
      fill: { color: "111E38" },
      line: { color: C_SUCCESS, width: 1 },
    });

    s.addText("INTELLIGENT WORKING DAY DEDUCTION ENGINE", {
      x: 0.8,
      y: 5.3,
      w: 11.7,
      h: 0.25,
      fontSize: 10,
      fontFace: "Arial",
      bold: true,
      color: C_SUCCESS,
    });

    s.addText(
      "• Automatic Non-Working Days Filter: Saturdays, Sundays, and dynamic company holidays within the requested date span are never deducted from employee quotas.\n• Half-Day Precision: Half-day selections deduct exactly 0.5 days, preventing over-deductions.\n• Real-Time Balance Check: Submitting a request validates available balance minus pending holds before inserting.",
      {
        x: 0.8,
        y: 5.6,
        w: 11.7,
        h: 0.8,
        fontSize: 10,
        fontFace: "Arial",
        color: C_TEXT_LIGHT,
        lineSpacing: 16,
      }
    );
  }

  // --- SLIDE 7: Core Feature Breakdown ---
  {
    const s = pptx.addSlide();
    s.background = { color: C_DARK_BG };
    addHeader(s, "6. Key Feature Breakdown by Application Area", "FEATURE SPECIFICATION");

    const features = [
      {
        title: "Employee Portal",
        items: [
          "• Dashboard with visual balance cards & progress bars",
          "• Apply Leave modal with live working days counter",
          "• Real-time request tracking & self-cancellation option",
          "• Notification bell with unread badges & fast links",
        ],
      },
      {
        title: "Manager Approval Hub",
        items: [
          "• Pending Stage 1 Approval queue with 1-click decisions",
          "• Team availability calendar & clash detector",
          "• Full requester context, balance history & reason",
          "• Rejection reason capture & automated notification",
        ],
      },
      {
        title: "HR Administration & Control",
        items: [
          "• Stage 2 Final Approval with overriding controls",
          "• Leave revocation engine with automatic balance refund",
          "• User Management (add/deactivate/password reset)",
          "• Holiday calendar editor & CSV Data Export",
        ],
      },
      {
        title: "Security & Auditing",
        items: [
          "• Immutable, append-only SQLite audit log stream",
          "• Anti self-approval guards at database layer",
          "• Automatic delegation support when manager is on leave",
          "• Instant 1-click User Switcher for rapid demo & QA",
        ],
      },
    ];

    features.forEach((f, idx) => {
      const row = Math.floor(idx / 2);
      const col = idx % 2;
      const x = 0.6 + col * 6.15;
      const y = 1.5 + row * 2.5;

      s.addShape(pptx.ShapeType.roundRect, {
        x: x,
        y: y,
        w: 5.95,
        h: 2.3,
        rectRadius: 0.15,
        fill: { color: C_CARD_BG },
        line: { color: C_PRIMARY, width: 1 },
      });

      s.addText(f.title, {
        x: x + 0.3,
        y: y + 0.2,
        w: 5.35,
        h: 0.35,
        fontSize: 14,
        fontFace: "Arial",
        bold: true,
        color: C_ACCENT,
      });

      s.addText(f.items.join("\n"), {
        x: x + 0.3,
        y: y + 0.6,
        w: 5.35,
        h: 1.55,
        fontSize: 10.5,
        fontFace: "Arial",
        color: C_TEXT_LIGHT,
        lineSpacing: 16,
      });
    });
  }

  // --- SLIDE 8: How to Run, Test & Operate the App ---
  {
    const s = pptx.addSlide();
    s.background = { color: C_DARK_BG };
    addHeader(s, "7. How to Run, Test & Operate the System", "DEPLOYMENT & USER MANUAL");

    const steps = [
      {
        title: "1. Launch Local App",
        cmd: "npm run dev",
        desc: "Open http://localhost:3000 in your browser to view the login interface.",
      },
      {
        title: "2. 1-Click Fast Login",
        cmd: "Select any demo user",
        desc: "Click 'Login as Chandu (Manager)', 'Login as Srihari (HR)', or 'Login as Employee'.",
      },
      {
        title: "3. Test Leave Workflow",
        cmd: "Apply -> Manager -> HR",
        desc: "Submit a request as Ramakrishna, switch to Chandu to approve Stage 1, switch to Srihari for Stage 2.",
      },
      {
        title: "4. User Switcher & Logout",
        cmd: "/logout or Top Nav Switcher",
        desc: "Use the top header dropdown to switch personas instantly without retyping passwords.",
      },
    ];

    steps.forEach((st, idx) => {
      const x = 0.6 + idx * 3.08;
      s.addShape(pptx.ShapeType.roundRect, {
        x: x,
        y: 1.5,
        w: 2.9,
        h: 5.0,
        rectRadius: 0.15,
        fill: { color: C_CARD_BG },
        line: { color: C_CARD_BORDER, width: 1.5 },
      });

      s.addText(st.title, {
        x: x + 0.2,
        y: 1.75,
        w: 2.5,
        h: 0.45,
        fontSize: 13,
        fontFace: "Arial",
        bold: true,
        color: C_ACCENT,
      });

      s.addShape(pptx.ShapeType.roundRect, {
        x: x + 0.2,
        y: 2.3,
        w: 2.5,
        h: 0.6,
        rectRadius: 0.08,
        fill: { color: "0F172A" },
        line: { color: C_PRIMARY, width: 1 },
      });

      s.addText(st.cmd, {
        x: x + 0.2,
        y: 2.4,
        w: 2.5,
        h: 0.4,
        fontSize: 10,
        fontFace: "Courier New",
        bold: true,
        color: C_SUCCESS,
        align: "center",
      });

      s.addText(st.desc, {
        x: x + 0.2,
        y: 3.1,
        w: 2.5,
        h: 3.1,
        fontSize: 11,
        fontFace: "Arial",
        color: C_TEXT_MUTED,
        lineSpacing: 18,
      });
    });
  }

  // --- SLIDE 9: Project Summary & Roadmap ---
  {
    const s = pptx.addSlide();
    s.background = { color: C_DARK_BG };
    addHeader(s, "8. Development Summary & Next Milestones", "SUMMARY & ROADMAP");

    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.6,
      y: 1.5,
      w: 5.95,
      h: 4.9,
      rectRadius: 0.15,
      fill: { color: C_CARD_BG },
      line: { color: C_SUCCESS, width: 1.5 },
    });

    s.addText("COMPLETED DELIVERABLES", {
      x: 0.9,
      y: 1.75,
      w: 5.35,
      h: 0.35,
      fontSize: 15,
      fontFace: "Arial",
      bold: true,
      color: C_SUCCESS,
    });

    s.addText(
      "✔ Two-stage hierarchical approval workflow (Manager -> HR)\n" +
      "✔ Automatic weekend & holiday calendar deduction exclusions\n" +
      "✔ Half-day (0.5 day) & backdated sick leave support\n" +
      "✔ Anti self-approval rules & manager on-leave delegation\n" +
      "✔ HR Revocation engine with instant balance refund\n" +
      "✔ Role-based access control with domain restriction\n" +
      "✔ 1-Click User Switcher & Demo Login for testing\n" +
      "✔ Append-only SQLite audit log & CSV data export",
      {
        x: 0.9,
        y: 2.2,
        w: 5.35,
        h: 3.9,
        fontSize: 11,
        fontFace: "Arial",
        color: C_TEXT_LIGHT,
        lineSpacing: 21,
      }
    );

    s.addShape(pptx.ShapeType.roundRect, {
      x: 6.78,
      y: 1.5,
      w: 5.95,
      h: 4.9,
      rectRadius: 0.15,
      fill: { color: C_CARD_BG },
      line: { color: C_ACCENT, width: 1.5 },
    });

    s.addText("UPCOMING ROADMAP ENHANCEMENTS", {
      x: 7.08,
      y: 1.75,
      w: 5.35,
      h: 0.35,
      fontSize: 15,
      fontFace: "Arial",
      bold: true,
      color: C_ACCENT,
    });

    s.addText(
      "✦ SMTP Email Notifications for live approvals & status updates\n" +
      "✦ Microsoft Outlook & Google Calendar sync for approved leaves\n" +
      "✦ Automated monthly accrual cron (1 CL / month, 1.25 EL / month)\n" +
      "✦ Year-end carry forward & lapse scheduler (Dec 31 roll-over)\n" +
      "✦ PDF Leave Certificate generator for official visa / medical proofs\n" +
      "✦ Mobile PWA (Progressive Web App) offline support & push alerts",
      {
        x: 7.08,
        y: 2.2,
        w: 5.35,
        h: 3.9,
        fontSize: 11,
        fontFace: "Arial",
        color: C_TEXT_LIGHT,
        lineSpacing: 21,
      }
    );
  }

  await pptx.writeFile({ fileName: pptxPath });
  console.log("PPTX presentation generated successfully at:", pptxPath);
}

// ==========================================
// 2. GENERATE COMPREHENSIVE PDF SUMMARY
// ==========================================
function generatePDF(targetPath) {
  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
    bufferPages: true,
  });

  const stream = fs.createWriteStream(targetPath);
  doc.pipe(stream);

  const primaryColor = "#0f172a";
  const accentColor = "#4338ca";
  const cyanColor = "#0284c7";
  const textColor = "#334155";
  const greenColor = "#059669";
  const redColor = "#dc2626";

  // Helper function for section headings
  function sectionHeader(title, subtitle) {
    doc.moveDown(0.6);
    doc.fillColor(accentColor).fontSize(14).font("Helvetica-Bold").text(title);
    if (subtitle) {
      doc.fillColor("#64748b").fontSize(9).font("Helvetica").text(subtitle);
    }
    doc.moveDown(0.3);
    doc.strokeColor("#cbd5e1").lineWidth(0.75).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);
  }

  // --- COVER / HEADER ---
  doc.fillColor(accentColor).fontSize(22).font("Helvetica-Bold").text("Especiallyyours Leave Management System");
  doc.fillColor(cyanColor).fontSize(13).font("Helvetica-Bold").text("ELMS — App Development Summary & Operational Guide");
  doc.moveDown(0.3);
  doc.fillColor("#64748b").fontSize(9).font("Helvetica").text("Document Version: 1.0 (Production Architecture & User Manual)  |  Target: All Team Members, Chandu (Mgr), Srihari (HR)");
  doc.moveDown(0.4);
  doc.strokeColor(accentColor).lineWidth(1.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.8);

  // --- SECTION 1: EXECUTIVE SUMMARY ---
  sectionHeader("1. Executive Summary & Purpose", "Core motivation, objectives, and problem solved");
  doc.fillColor(textColor).fontSize(9.5).font("Helvetica").text(
    "Especiallyyours Leave Management System (ELMS) is a secure, private web application engineered to streamline employee leave applications, quota tracking, working-day calculations, and automated multi-stage approvals. It eliminates informal, untraceable communication (WhatsApp/email) and provides full auditability, zero double-booking, and strict adherence to internal leave policies.",
    { lineGap: 3 }
  );

  // --- SECTION 2: TECH STACK & ARCHITECTURE ---
  sectionHeader("2. Technology Stack & System Architecture", "Modern, high-performance, type-safe full-stack setup");
  const techItems = [
    { label: "Web Framework", val: "Next.js 16 (App Router + Turbopack SSR/RSC + Server Actions)" },
    { label: "Type Safety", val: "TypeScript (Strict compile-time validation & type-safe data schemas)" },
    { label: "Styling & UI", val: "Vanilla CSS + Tailwind CSS (Modern dark glassmorphism aesthetic)" },
    { label: "Database Layer", val: "SQLite (data/elms.db via Node.js native DatabaseSync with WAL mode & Foreign Keys)" },
    { label: "Authentication", val: "NextAuth.js JWT sessions, domain-locked to @especiallyyours.com, 8-hour timeout" },
    { label: "Audit Engine", val: "Immutable append-only SQLite log recording all submissions, approvals, delegations & edits" },
  ];

  techItems.forEach((item) => {
    doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(9).text(`• ${item.label}: `, { continued: true });
    doc.fillColor(textColor).font("Helvetica").fontSize(9).text(item.val);
    doc.moveDown(0.2);
  });

  // --- SECTION 3: ROSTER & CREDENTIALS ---
  sectionHeader("3. User Roster & Account Access", "Pre-seeded team accounts & login credentials");
  doc.fillColor(textColor).fontSize(8.5).font("Helvetica").text(
    "Universal Default Password for all initial accounts: Password123! (Access domain: @especiallyyours.com)",
    { lineGap: 2 }
  );
  doc.moveDown(0.4);

  // Table header
  let y = doc.y;
  doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(8.5);
  doc.text("Name", 45, y, { width: 130 });
  doc.text("Email Address", 175, y, { width: 165 });
  doc.text("Role", 340, y, { width: 65 });
  doc.text("Department", 405, y, { width: 75 });
  doc.text("Reports To", 480, y, { width: 75 });

  doc.moveDown(0.3);
  doc.strokeColor("#94a3b8").lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.3);

  const roster = [
    { name: "Chandu", email: "chandu@especiallyyours.com", role: "MANAGER", dept: "Management", mgr: "None (Top Mgr)" },
    { name: "Srihari", email: "srihari@especiallyyours.com", role: "HR ADMIN", dept: "Human Resources", mgr: "None (HR Admin)" },
    { name: "Undapalli Ramakrishna", email: "dropship@especiallyyours.com", role: "EMPLOYEE", dept: "E-commerce", mgr: "Chandu" },
    { name: "Durga Prasad", email: "durgaprasad@especiallyyours.com", role: "EMPLOYEE", dept: "E-commerce", mgr: "Chandu" },
    { name: "Pampana Ramakrishna Prasad", email: "prasad@especiallyyours.com", role: "EMPLOYEE", dept: "E-commerce", mgr: "Chandu" },
    { name: "Ravi", email: "ravi@especiallyyours.com", role: "EMPLOYEE", dept: "Finance", mgr: "Chandu" },
    { name: "Sandeep", email: "sandeep@especiallyyours.com", role: "EMPLOYEE", dept: "Finance", mgr: "Chandu" },
  ];

  doc.font("Helvetica").fontSize(8).fillColor(textColor);
  roster.forEach((row) => {
    y = doc.y;
    doc.text(row.name, 45, y, { width: 130 });
    doc.text(row.email, 175, y, { width: 165 });
    doc.text(row.role, 340, y, { width: 65 });
    doc.text(row.dept, 405, y, { width: 75 });
    doc.text(row.mgr, 480, y, { width: 75 });
    doc.moveDown(0.35);
  });

  // --- SECTION 4: APPROVAL WORKFLOW ---
  sectionHeader("4. Two-Stage Approval Routing & Decision Logic", "How leave requests move through the system");
  doc.fillColor(textColor).fontSize(9).font("Helvetica").text(
    "1. Submission: Employee submits request -> Status: PENDING_MANAGER. System places a temporary 'Hold' on the employee's leave balance so the days cannot be double-booked.\n" +
    "2. Stage 1 (Manager Review): Chandu reviews request on the Approvals dashboard. If Approved -> Status becomes PENDING_HR. If Rejected -> Status becomes REJECTED and the balance hold is released immediately.\n" +
    "3. Stage 2 (HR Final Approval): Srihari (HR) reviews Stage 1 approved requests. If Approved -> Status becomes APPROVED and the hold is converted into a deducted balance. If Rejected -> Balance hold is released.\n" +
    "4. Special Routing Rules:\n" +
    "    • Chandu's Leave: Bypasses Stage 1 and routes directly to Srihari (HR) for single-stage sign-off.\n" +
    "    • Srihari's Leave: Bypasses Stage 2 and routes directly to Chandu (Manager) for single-stage sign-off.\n" +
    "    • Anti Self-Approval Guard: No user can approve or reject their own leave requests.\n" +
    "    • Manager On-Leave Delegation: If Chandu is on approved leave today, HR is empowered to act as a delegate.\n" +
    "    • HR Revocation: Approved leave can be revoked by HR with a mandatory reason, automatically refunding balance.",
    { lineGap: 3 }
  );

  // --- SECTION 5: LEAVE POLICY MATRIX ---
  sectionHeader("5. Leave Policies & Accrual Matrix", "Annual quotas, carry-forward limits and policy constraints");
  
  y = doc.y;
  doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(8.5);
  doc.text("Code", 45, y, { width: 35 });
  doc.text("Leave Type", 80, y, { width: 110 });
  doc.text("Quota", 190, y, { width: 55 });
  doc.text("Accrual Logic", 245, y, { width: 95 });
  doc.text("Carry Over", 340, y, { width: 70 });
  doc.text("Rules & Constraints", 410, y, { width: 145 });

  doc.moveDown(0.3);
  doc.strokeColor("#94a3b8").lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.3);

  const policies = [
    { code: "CL", name: "Casual Leave", quota: "12 Days", accrual: "1 day / month", cf: "0 (Lapses)", rules: "Min 0.5d (Half-day supported)" },
    { code: "SL", name: "Sick Leave", quota: "6 Days", accrual: "Upfront full credit", cf: "0 (Lapses)", rules: "Backdating <=7d; Cert for >=3d" },
    { code: "EL", name: "Earned Leave", quota: "15 Days", accrual: "1.25 days / month", cf: "Max 30 Days", rules: "7d advance notice for >=3d" },
    { code: "LOP", name: "Loss of Pay", quota: "Unlimited", accrual: "On exhaustion", cf: "N/A", rules: "Unpaid leave; payroll flagged" },
    { code: "CO", name: "Comp Off", quota: "As Earned", accrual: "Overtime credit", cf: "90d validity", rules: "Manager logged extra work" },
    { code: "ML/PL", name: "Maternity/Paternity", quota: "Statutory", accrual: "On event", cf: "N/A", rules: "ML: 26 weeks, PL: 5 days" },
  ];

  doc.font("Helvetica").fontSize(8).fillColor(textColor);
  policies.forEach((p) => {
    y = doc.y;
    doc.text(p.code, 45, y, { width: 35 });
    doc.text(p.name, 80, y, { width: 110 });
    doc.text(p.quota, 190, y, { width: 55 });
    doc.text(p.accrual, 245, y, { width: 95 });
    doc.text(p.cf, 340, y, { width: 70 });
    doc.text(p.rules, 410, y, { width: 145 });
    doc.moveDown(0.35);
  });

  doc.moveDown(0.4);
  doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(8.5).text("Important Calculation Rule: ", { continued: true });
  doc.fillColor(textColor).font("Helvetica").fontSize(8.5).text(
    "Weekends (Saturdays & Sundays) and designated company holidays occurring inside the requested date range are automatically excluded and NEVER deducted from employee balances."
  );

  // --- SECTION 6: HOW TO OPERATE & TEST ---
  sectionHeader("6. Operational Guide & Quick Testing Manual", "Step-by-step instructions for running and evaluating the application");
  doc.fillColor(textColor).fontSize(9).font("Helvetica").text(
    "• Start Development Server: Run `npm run dev` in the terminal and navigate to http://localhost:3000\n" +
    "• 1-Click Fast Login: On the login page, use the 'Quick Demo Login' cards to log in as Chandu, Srihari, or an Employee.\n" +
    "• Instant User Switcher: Once logged in, use the user dropdown menu in the top-right header navigation to switch between roles instantly without logging out.\n" +
    "• Sign Out / Session Clear: Visit http://localhost:3000/logout to instantly clear all cookies and return to the login screen.\n" +
    "• HR Admin Controls: When logged in as Srihari, access the /hr route to manage users, update policies, configure holidays, view audit logs, or export CSV data.\n" +
    "• Production Build: Run `npm run build` followed by `npm start` for production deployment.",
    { lineGap: 3 }
  );

  // Page footer
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text(
      `Especiallyyours Leave Management System (ELMS) — Page ${i + 1} of ${range.count}`,
      40,
      doc.page.height - 30,
      { align: "center", width: doc.page.width - 80 }
    );
  }

  doc.end();
  stream.on("finish", () => {
    console.log("PDF generated successfully at:", targetPath);
  });
}

async function run() {
  console.log("Generating PPTX presentation...");
  await generatePresentation();

  console.log("Generating PDF summaries...");
  generatePDF(pdfPath);
  generatePDF(pdfPath2);
}

run().catch(console.error);
