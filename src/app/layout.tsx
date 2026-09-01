import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import Nav from "@/components/Nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ELMS — Especiallyyours Leave Management System",
  description: "Private, internal-only employee leave management system.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
        {session?.user && <Nav user={session.user} />}
        <main className={`flex-1 w-full ${session?.user ? "max-w-7xl mx-auto px-4 sm:px-6 py-8" : ""}`}>{children}</main>
        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950/80">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>Especiallyyours Leave Management System (ELMS) · Private &amp; Internal Only</span>
            <span>Version 1.0 (Draft) · Domain: especiallyyours.com</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
