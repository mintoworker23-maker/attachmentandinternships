import Footer from "@/components/Footer";
import FloatingSocialLinks from "@/components/FloatingSocialLinks";
import Navbar from "@/components/Navbar";
import WhatsAppJoinModal from "@/components/WhatsAppJoinModal";
import Link from "next/link";
import { notFound } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";

type ListingTrack = "attachment" | "internship" | "graduate-trainee";

type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  postedDate: string;
  track: ListingTrack;
  category?: string;
  department?: string;
  reportsTo?: string;
  workMode?: string;
  experience?: string;
  educationLevel?: string;
  salaryRange?: string;
  overview?: string;
  rolePurpose?: string;
  responsibilities?: string[];
  knowHow?: string[];
  problemSolvingAndAccountability?: string[];
  qualifications?: string[];
  tags?: string[];
  benefits?: string[];
  application?: {
    deadline?: string;
    applyUrl?: string;
    instructions?: string;
  };
  image?: string;
};

type JobPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamicParams = false;

const trackToPath: Record<ListingTrack, string> = {
  attachment: "/attachment",
  internship: "/internships",
  "graduate-trainee": "/graduate-trainees",
};

const trackToLabel: Record<ListingTrack, string> = {
  attachment: "Jobs",
  internship: "Internships",
  "graduate-trainee": "Graduate Trainees",
};

async function getJobs() {
  const filePath = path.join(process.cwd(), "public", "data", "jobs.json");
  const file = await fs.readFile(filePath, "utf8");
  return JSON.parse(file) as JobListing[];
}

export async function generateStaticParams() {
  const jobs = await getJobs();
  return jobs.map((job) => ({ id: job.id }));
}

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params;
  const jobs = await getJobs();
  const job = jobs.find((item) => item.id === id);

  if (!job) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const listingUrl = `${siteUrl}/jobs/${job.id}`;
  const shareMessage = `Check out this job: ${job.title} at ${job.company} in ${job.location}. Apply here: ${listingUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(listingUrl)}`;
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this job opening: ${job.title}`)}&url=${encodeURIComponent(listingUrl)}`;
  const responsibilities = job.responsibilities ?? [
    "Support team projects and deliverables according to timelines.",
    "Maintain accurate reporting and stakeholder communication.",
    "Contribute to process improvements and risk monitoring.",
  ];
  const knowHow = job.knowHow ?? [
    "Technical and domain knowledge relevant to the role.",
    "Planning, reporting, and stakeholder collaboration skills.",
    "Strong communication and teamwork orientation.",
  ];
  const problemSolvingAndAccountability = job.problemSolvingAndAccountability ?? [
    "Works within policies and regulatory frameworks to support decisions.",
    "Interprets data, identifies trends, and recommends practical actions.",
    "Escalates major operational or strategic risks where required.",
  ];
  const qualifications = job.qualifications ?? [
    "Bachelor’s degree in a related field.",
    "Relevant practical experience in the role area.",
    "Strong analytical, communication, and collaboration skills.",
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#e7edf8] via-[#edf3fb] to-[#dce7f6] px-3 pb-4 pt-20 sm:px-4">
      <div className="pointer-events-none absolute -left-16 top-[-9rem] h-72 w-72 rounded-full bg-sky-400/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-8 top-20 h-56 w-56 rounded-full bg-cyan-300/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 left-1/3 h-64 w-64 rounded-full bg-indigo-300/25 blur-3xl" />

      <FloatingSocialLinks />
      <WhatsAppJoinModal jobTitle={job.title} />

      <div className="relative z-10">
        <Navbar />

        <main id="job-content" className="mx-auto mt-10 w-full max-w-6xl space-y-6">
          <a href="#job-content" className="inline-block text-sm font-medium text-slate-700 hover:text-slate-900">
            Skip to content
          </a>

          <section className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-8">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">
                Home
              </Link>
              <span>&gt;</span>
              <Link href={trackToPath[job.track]} className="hover:text-slate-900">
                {trackToLabel[job.track]}
              </Link>
              <span>&gt;</span>
              <span className="text-slate-900">{job.category ?? "Job Details"}</span>
            </nav>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {job.title} at {job.company}
            </h1>
            <p className="mt-2 text-sm text-slate-600">Posted on {job.postedDate}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-300 bg-slate-100 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-600">Employment</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{job.type}</p>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-100 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-600">Location</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{job.location}</p>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-100 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-600">Experience</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{job.experience ?? "Not specified"}</p>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-100 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-600">Education Level</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{job.educationLevel ?? "Not specified"}</p>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[2rem] border border-slate-700/80 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900/80 p-8">
            <svg className="pointer-events-none absolute inset-x-0 top-0 h-16 w-full opacity-40" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0,0V46.29c47.79,22,103.59,29.05,158,17.39C230,47.6,284.58,9.63,339,2.84c54.5-6.82,108.7,16.24,163,35.2c59.67,20.84,117.23,28.68,176,19.84c59.68-9,112.76-33.3,171-48.1c59.22-15,112.6-15.2,168,4.76V0Z" className="fill-sky-500/50" />
            </svg>
            <p className="relative text-sm font-semibold uppercase tracking-[0.12em] text-sky-200">
              Opportunities Meet Aspirations
            </p>
            <h2 className="relative mt-2 text-2xl font-bold text-white sm:text-3xl">Job Title: {job.title}</h2>
            <p className="relative mt-3 text-sm text-slate-200">
              {`Reports to: ${job.reportsTo ?? "Not specified"} • Department: ${job.department ?? "Not specified"} • Location: ${job.location}`}
            </p>
          </section>

          <section className="rounded-[2rem] border border-slate-300 bg-white p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-slate-900">Role Purpose Statement</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {job.rolePurpose ??
                `${job.title} will provide strategic and operational support to ${job.company}, helping improve delivery, reporting, and decision quality across core workflows.`}
            </p>
            {job.overview && <p className="mt-3 text-sm leading-7 text-slate-700">{job.overview}</p>}

            <h3 className="mt-8 text-xl font-semibold text-slate-900">Key Responsibilities</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              {responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-300 bg-slate-100 p-5">
                <h4 className="text-lg font-semibold text-slate-900">Know How</h4>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                  {knowHow.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-300 bg-slate-100 p-5">
                <h4 className="text-lg font-semibold text-slate-900">Problem Solving &amp; Accountability</h4>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                  {problemSolvingAndAccountability.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <h3 className="mt-8 text-xl font-semibold text-slate-900">Qualifications</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              {qualifications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {job.application?.applyUrl ? (
                <a
                  href={job.application.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                >
                  Read More &amp; Apply
                </a>
              ) : (
                <button
                  type="button"
                  className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                >
                  Read More &amp; Apply
                </button>
              )}
              {job.application?.deadline && (
                <p className="text-sm text-slate-700">Application deadline: {job.application.deadline}</p>
              )}
              {job.salaryRange && <p className="text-sm text-slate-700">Salary: {job.salaryRange}</p>}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-300 bg-white p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-slate-900">Share This Post</h3>
            <p className="mt-2 text-sm text-slate-700">
              {`I found this opening for ${job.title} at ${job.company}. Check it out:`}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Share on WhatsApp"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_10px_24px_-14px_rgba(15,23,42,0.9)] transition hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="1.2rem" fill="#128C7E" viewBox="0 0 448 512" aria-hidden="true">
                  <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                </svg>
              </a>
              <a
                href={linkedinShareUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Share on LinkedIn"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_10px_24px_-14px_rgba(15,23,42,0.9)] transition hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="1.2rem" fill="#0a66c2" viewBox="0 0 448 512" aria-hidden="true">
                  <path d="M100.3 448H7.4V148.9h92.9zM53.8 108.1C24.1 108.1 0 83.5 0 53.8a53.8 53.8 0 0 1 107.6 0c0 29.7-24.1 54.3-53.8 54.3zM447.9 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z" />
                </svg>
              </a>
              <a
                href={xShareUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Share on X"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_10px_24px_-14px_rgba(15,23,42,0.9)] transition hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="1.2rem" fill="#262626" viewBox="0 0 512 512" aria-hidden="true">
                  <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                </svg>
              </a>
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </div>
  );
}
