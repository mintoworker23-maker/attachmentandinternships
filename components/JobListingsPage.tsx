"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type ListingTrack = "attachment" | "internship" | "graduate-trainee";

type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  postedDate: string;
  track: ListingTrack;
  image?: string;
};

type JobListingsPageProps = {
  title: string;
  track: ListingTrack;
};

export default function JobListingsPage({ title, track }: JobListingsPageProps) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  useEffect(() => {
    let mounted = true;

    const loadJobs = async () => {
      try {
        const response = await fetch("/data/jobs.json");
        if (!response.ok) throw new Error("Failed to load jobs");

        const data = (await response.json()) as JobListing[];
        if (!mounted) return;
        setJobs(data);
      } catch {
        if (!mounted) return;
        setError("Could not load job listings.");
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

  const jobsByTrack = useMemo(() => {
    return jobs
      .filter((job) => job.track === track)
      .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
  }, [jobs, track]);

  const typeOptions = useMemo(() => {
    return ["all", ...new Set(jobsByTrack.map((job) => job.type))];
  }, [jobsByTrack]);

  const locationOptions = useMemo(() => {
    return ["all", ...new Set(jobsByTrack.map((job) => job.location))];
  }, [jobsByTrack]);

  const filteredJobs = useMemo(() => {
    const loweredSearch = search.trim().toLowerCase();

    return jobsByTrack.filter((job) => {
      const matchesSearch =
        loweredSearch.length === 0 ||
        job.title.toLowerCase().includes(loweredSearch) ||
        job.company.toLowerCase().includes(loweredSearch);
      const matchesType = typeFilter === "all" || job.type === typeFilter;
      const matchesLocation = locationFilter === "all" || job.location === locationFilter;

      return matchesSearch && matchesType && matchesLocation;
    });
  }, [jobsByTrack, search, typeFilter, locationFilter]);

  return (
    <main className="mx-auto mt-10 w-full max-w-7xl rounded-[2rem] border border-slate-700/80 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(2,6,23,0.85)] backdrop-blur-xl sm:p-8">
      <section className="rounded-2xl border border-slate-300 bg-slate-100 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Filters</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.08em] text-slate-700">Search</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or company"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.08em] text-slate-700">Type</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500"
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All types" : type}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.08em] text-slate-700">Location</span>
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500"
            >
              {locationOptions.map((location) => (
                <option key={location} value={location}>
                  {location === "all" ? "All locations" : location}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-600/80 bg-gradient-to-r from-slate-950 to-slate-800 px-4 py-3">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Latest {title}</h1>
          <span className="text-sm font-medium text-slate-300">{filteredJobs.length} results</span>
        </div>

        {loading && <p className="mt-6 text-sm text-slate-700">Loading listings...</p>}
        {error && <p className="mt-6 text-sm font-medium text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="mt-6 grid gap-3">
            {filteredJobs.length === 0 && (
              <p className="rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-700">
                No listings match the selected filters.
              </p>
            )}

            {filteredJobs.map((job) => (
              <article
                key={job.id}
                className="overflow-hidden rounded-2xl border border-slate-300 bg-white transition hover:border-sky-400"
              >
                <div className="grid min-h-[7.5rem] grid-cols-[5.5rem_1fr]">
                  <div className="relative flex h-full items-center justify-center bg-slate-100">
                    {job.image ? (
                      <Image
                        src={job.image}
                        alt={`${job.company} logo`}
                        fill
                        sizes="88px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="relative z-10 text-xs font-semibold uppercase text-slate-700">
                        {job.company.slice(0, 2)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold leading-snug text-slate-950 transition hover:text-sky-700 sm:text-lg">
                          <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                        </h3>
                        <p className="mt-1 text-sm font-medium text-slate-700">{job.company}</p>
                      </div>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                        {job.type}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-700 sm:text-sm">
                      <span>{job.location}</span>
                      <span className="text-slate-400">•</span>
                      <span>Posted {job.postedDate}</span>
                      <span className="text-slate-400">•</span>
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
    </main>
  );
}
