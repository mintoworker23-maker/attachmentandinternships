"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type NavLink = {
  label: string;
  href: string;
};

type NavbarProps = {
  links?: NavLink[];
};

const defaultLinks: NavLink[] = [
  { label: "Attachment", href: "/attachment" },
  { label: "Internships", href: "/internships" },
  { label: "Graduate Trainees", href: "/graduate-trainees" },
];

export default function Navbar({
  links = defaultLinks,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <nav className="relative mx-auto w-full max-w-7xl rounded-[2rem] border border-slate-700/80 bg-slate-950 px-5 py-4 text-slate-100 shadow-[0_20px_45px_-30px_rgba(2,6,23,0.9)] sm:px-8">
        <Link
          href="/"
          aria-label="Go to homepage"
          className="absolute left-4 top-full z-[60] inline-flex -translate-y-6/7 items-center justify-center sm:left-8"
        >
          <span className="absolute h-[5.5rem] w-[5.5rem] bg-white shadow-[0_12px_24px_-16px_rgba(2,6,23,0.95)]" />
          <Image
            src="/Favicon.png"
            alt="Site logo"
            width={80}
            height={80}
            className="relative z-10 h-[5rem] w-[5rem]"
            priority
          />
        </Link>

        <div className="relative flex items-center justify-between gap-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div />

          <div className="hidden flex-wrap items-center justify-center gap-2 text-sm font-medium text-slate-200 sm:flex">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-full border border-transparent px-2.5 py-1.5 transition hover:border-slate-500/70 hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </a>
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
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
