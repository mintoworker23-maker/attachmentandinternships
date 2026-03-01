"use client";

import Link from "next/link";
import { useState } from "react";

type NavLink = {
  label: string;
  href: string;
};

type NavbarProps = {
  brand?: string;
  accent?: string;
  links?: NavLink[];
};

const defaultLinks: NavLink[] = [
  { label: "Attachment", href: "/attachment" },
  { label: "Internships", href: "/internships" },
  { label: "Graduate Trainees", href: "/graduate-trainees" },
  { label: "Contact Us", href: "#footer" },
];

export default function Navbar({
  brand = "Attachment and Internships in Kenya",
  accent = "",
  links = defaultLinks,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <nav className="relative mx-auto w-full max-w-7xl rounded-[2rem] border border-slate-700/80 bg-slate-950/85 px-5 py-4 text-slate-100 shadow-[0_20px_45px_-30px_rgba(2,6,23,0.9)] backdrop-blur-xl sm:px-8">
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[linear-gradient(120deg,rgba(14,165,233,0.28),rgba(56,189,248,0.12),rgba(15,23,42,0.26))]" />

        <div className="relative flex items-center justify-between gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <Link href="/" className="w-fit text-xl font-semibold tracking-tight text-white">
            {brand}
            {accent ? (
              <span className="ml-1 bg-gradient-to-r from-sky-300 to-cyan-200 bg-clip-text text-transparent">
                {accent}
              </span>
            ) : null}
          </Link>

          <div className="hidden flex-wrap items-center justify-center gap-2 text-sm font-medium text-slate-200 sm:flex">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full border border-transparent px-2.5 py-1.5 transition hover:border-slate-500/70 hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              aria-label="Search"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-500/70 bg-white/10 text-slate-100 transition hover:border-slate-300/70 hover:bg-white/20"
            >
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>

            <button
              type="button"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-500/70 bg-white/10 text-slate-100 transition hover:border-slate-300/70 hover:bg-white/20 sm:hidden"
            >
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                {isMenuOpen ? (
                  <path d="m6 6 12 12M18 6 6 18" />
                ) : (
                  <>
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="relative mt-4 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-2 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.85)] sm:hidden">
            <div className="flex flex-col">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
