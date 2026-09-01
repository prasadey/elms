const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const outputPath = path.join(process.cwd(), "..", "ELMS_System_Summary_and_Guide.pdf");
const doc = new PDFDocument({ margin: 40, size: "A4" });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Styling colors
const primaryColor = "#0f172a"; // slate-950
const accentColor = "#4f46e5"; // indigo-600
const textColor = "#334155"; // slate-700

// Header / Title
doc
  .fillColor(accentColor)
  .fontSize(20)
  .font("Helvetica-Bold")
  .text("Especiallyyours Leave Management System (ELMS)", { align: "left" });

doc
  .fillColor("#64748b")
  .fontSize(11)
  .font("Helvetica")
  .text("Technical Summary & Operational Guide for Teams", { align: "left" });

doc.moveDown(0.5);
doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
doc.moveDown(1);

// Section 1: Executive Overview
doc
  .fillColor(primaryColor)
  .fontSize(13)
  .font("Helvetica-Bold")
  .text("1. Executive Overview & Purpose");

doc.moveDown(0.3);
doc
  .fillColor(textColor)
  .fontSize(9.5)
  .font("Helvetica")
  .text(
    "ELMS is a private, internal-only web application designed for EspeciallyYours employees to apply for leave, route requests through a strict two-stage approval chain (Manager -> HR), calculate accurate working days, track entitlements, and maintain an immutable, append-only audit trail.",
    { lineGap: 3 }
  );

doc.moveDown(0.8);

// Section 2: Architecture & Tech Stack
doc
  .fillColor(primaryColor)
  .fontSize(13)
  .font("Helvetica-Bold")
  .text("2. Architecture & Technology Stack");

doc.moveDown(0.3);
doc
  .fillColor(textColor)
  .fontSize(9.5)
  .font("Helvetica")
  .text("• Framework: Next.js 16 (App Router + Turbopack SSR/RSC)\n" +
        "• Language: TypeScript (Strict Type Safety)\n" +
        "• Styling: Vanilla CSS & Tailwind CSS (Dark Glassmorphism UI Theme)\n" +
        "• Database: SQLite (data/elms.db with WAL mode & Foreign Keys)\n" +
        "• Security: Domain restriction (@especiallyyours.com), NextAuth JWT, Server-side authorization on every route.",
        { lineGap: 3 }
  );

doc.moveDown(0.8);

// Section 3: Seed Roster & Credentials
doc
  .fillColor(primaryColor)
  .fontSize(13)
  .font("Helvetica-Bold")
  .text("3. Initial Employee Roster & Credentials");

doc.moveDown(0.3);
doc
  .fillColor(textColor)
  .fontSize(9)
  .font("Helvetica")
  .text("All accounts are domain-restricted to @especiallyyours.com. Default Password for all accounts: Password123!", { lineGap: 2 });

doc.moveDown(0.4);

// Roster Table Headers
const startY = doc.y;
doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(8.5);
doc.text("Name", 45, startY, { width: 120 });
doc.text("Email", 165, startY, { width: 160 });
doc.text("Role", 325, startY, { width: 60 });
doc.text("Department", 385, startY, { width: 80 });
doc.text("Manager", 465, startY, { width: 85 });

doc.moveDown(0.3);
doc.strokeColor("#cbd5e1").lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
doc.moveDown(0.3);

const roster = [
  { name: "Chandu", email: "chandu@especiallyyours.com", role: "MANAGER", dept: "Management", mgr: "None (Top Mgr)" },
  { name: "Srihari", email: "srihari@especiallyyours.com", role: "HR", dept: "Human Resources", mgr: "None (HR Admin)" },
  { name: "Undapalli Ramakrishna", email: "dropship@especiallyyours.com", role: "EMPLOYEE", dept: "E-commerce", mgr: "Chandu" },
  { name: "Durga Prasad", email: "durgaprasad@especiallyyours.com", role: "EMPLOYEE", dept: "E-commerce", mgr: "Chandu" },
  { name: "Pampana Ramakrishna Prasad", email: "prasad@especiallyyours.com", role: "EMPLOYEE", dept: "E-commerce", mgr: "Chandu" },
  { name: "Ravi", email: "ravi@especiallyyours.com", role: "EMPLOYEE", dept: "Finance", mgr: "Chandu" },
  { name: "Sandeep", email: "sandeep@especiallyyours.com", role: "EMPLOYEE", dept: "Finance", mgr: "Chandu" },
];

doc.font("Helvetica").fontSize(8).fillColor(textColor);
roster.forEach((row) => {
  const y = doc.y;
  doc.text(row.name, 45, y, { width: 120 });
  doc.text(row.email, 165, y, { width: 160 });
  doc.text(row.role, 325, y, { width: 60 });
  doc.text(row.dept, 385, y, { width: 80 });
  doc.text(row.mgr, 465, y, { width: 85 });
  doc.moveDown(0.4);
});

doc.moveDown(0.8);

// Section 4: Workflow & Approval Logic
doc
  .fillColor(primaryColor)
  .fontSize(13)
  .font("Helvetica-Bold")
  .text("4. Workflow & Approval Chain Logic");

doc.moveDown(0.3);
doc
  .fillColor(textColor)
  .fontSize(9)
  .font("Helvetica")
  .text(
    "1. Submission: Employee submits leave -> Status PENDING_MANAGER (Hold placed on balance).\n" +
    "2. Stage 1 (Manager): Chandu approves -> Status PENDING_HR (or REJECTED).\n" +
    "3. Stage 2 (HR): Srihari approves -> Status APPROVED (Hold converted to Used balance).\n" +
    "4. Special Routing Rules:\n" +
    "    - Chandu's Leave: Direct single-stage approval by Srihari (HR).\n" +
    "    - Srihari's Leave: Direct single-stage approval by Chandu (Manager).\n" +
    "    - Self-Approval: Strictly prohibited at data-layer.\n" +
    "    - HR Delegation: HR can act as delegate if manager is on approved leave.",
    { lineGap: 3 }
  );

doc.moveDown(0.8);

// Section 5: Leave Policy Matrix
doc
  .fillColor(primaryColor)
  .fontSize(13)
  .font("Helvetica-Bold")
  .text("5. Leave Policy & Rules Matrix");

doc.moveDown(0.3);
doc
  .fillColor(textColor)
  .fontSize(9)
  .font("Helvetica")
  .text(
    "• Casual Leave (CL): 12 days/year, 1/month accrual, min 0.5 day, lapses Dec 31.\n" +
    "• Sick Leave (SL): 6 days/year upfront, backdating up to 7 days allowed, medical cert for 3+ days.\n" +
    "• Earned Leave (EL): 15 days/year, carry-forward up to 30 days, 7 days notice required for 3+ days.\n" +
    "• Loss of Pay (LOP): Unlimited balance, triggered automatically or manually when balance is exhausted.\n" +
    "• Weekend & Holiday Handling: Company holidays & weekends inside leave range are NOT deducted from balance.",
    { lineGap: 3 }
  );

doc.moveDown(0.8);

// Section 6: Running & Operating
doc
  .fillColor(primaryColor)
  .fontSize(13)
  .font("Helvetica-Bold")
  .text("6. Running & Operating the App");

doc.moveDown(0.3);
doc
  .fillColor(textColor)
  .fontSize(9)
  .font("Helvetica")
  .text(
    "• Development Server: Run 'npm run dev' -> Access http://localhost:3000\n" +
    "• Fresh Sign-Out Link: http://localhost:3000/logout\n" +
    "• Production Build: Run 'npm run build' followed by 'npm start'\n" +
    "• Quick User Switcher: Click the top-right user menu in the header navigation bar to switch role instantly.",
    { lineGap: 3 }
  );

doc.end();

stream.on("finish", () => {
  console.log("PDF generated successfully at:", outputPath);
});
stream.on("error", (err) => {
  console.error("PDF generation failed:", err);
});
