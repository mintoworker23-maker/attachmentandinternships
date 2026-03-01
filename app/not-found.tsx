import Footer from "@/components/Footer";
import FloatingSocialLinks from "@/components/FloatingSocialLinks";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#e7edf8] via-[#edf3fb] to-[#dce7f6] px-3 pb-4 pt-20 sm:px-4">
      <div className="pointer-events-none absolute -left-16 top-[-9rem] h-72 w-72 rounded-full bg-sky-400/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-8 top-20 h-56 w-56 rounded-full bg-cyan-300/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 left-1/3 h-64 w-64 rounded-full bg-indigo-300/25 blur-3xl" />

      <FloatingSocialLinks />
      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto mt-10 w-full max-w-5xl rounded-[2rem] border border-slate-300 bg-white p-8 shadow-[0_20px_50px_-35px_rgba(2,6,23,0.35)] sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Error 404</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Page not found
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
            The page you are looking for does not exist or may have been moved.
            Try navigating from the homepage or browse current opportunities.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Go to homepage
            </Link>
            <Link
              href="/attachment"
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
            >
              Browse jobs
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
