"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  postedDate: string;
  image?: string;
};

const MAX_VISIBLE = 5;

export default function LatestJobListings() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadJobs = async () => {
      try {
        const response = await fetch("/data/jobs.json");

        if (!response.ok) {
          throw new Error("Failed to load jobs");
        }

        const data = (await response.json()) as JobListing[];

        if (!mounted) return;

        setJobs(data);
      } catch {
        if (!mounted) return;
        setError("Could not load latest job listings.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    loadJobs();

    return () => {
      mounted = false;
    };
  }, []);

  const latestJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
      .slice(0, MAX_VISIBLE);
  }, [jobs]);

  return (
    <section className="mx-auto mt-10 w-full max-w-7xl rounded-[2rem] border border-slate-700/80 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(2,6,23,0.85)] backdrop-blur-xl sm:p-8">
      <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-600/80 bg-gradient-to-r from-slate-950 to-slate-800 px-4 py-3">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Latest Job Listings</h2>
        <Link href="/attachment" className="text-sm font-medium text-slate-300 hover:text-white">
          View all
        </Link>
      </div>

      {loading && <p className="mt-6 text-sm text-slate-300">Loading latest jobs...</p>}
      {error && <p className="mt-6 text-sm font-medium text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="mt-6 grid gap-3">
          {latestJobs.map((job) => (
            <article
              key={job.id}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 transition hover:border-sky-300"
            >
              <div className="grid min-h-[7.5rem] grid-cols-[5.5rem_1fr]">
                <div className="relative flex h-full items-center justify-center bg-slate-200">
                  {job.image ? (
                    <Image
                      src={job.image}
                      alt={`${job.company} logo`}
                      fill
                      sizes="88px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="relative z-10 text-xs font-semibold uppercase text-slate-500">
                      {job.company.slice(0, 2)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 transition hover:text-sky-700 sm:text-lg">
                        <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">{job.company}</p>
                    </div>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                      {job.type}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
                    <span>{job.location}</span>
                    <span className="text-slate-300">•</span>
                    <span>Posted {job.postedDate}</span>
                    <span className="text-slate-300">•</span>
                    <Link href={`/jobs/${job.id}`} className="font-medium text-sky-700 hover:text-sky-800">
                      View details
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
