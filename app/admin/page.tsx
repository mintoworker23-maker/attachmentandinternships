"use client";

import Footer from "@/components/Footer";
import FloatingSocialLinks from "@/components/FloatingSocialLinks";
import Navbar from "@/components/Navbar";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase"; // our Firebase initialization


type ListingTrack = "attachment" | "internship" | "graduate-trainee";

type JobApplication = {
  deadline?: string;
  applyUrl?: string;
  instructions?: string;
};

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
  application?: JobApplication;
  image?: string;
};

type JobFormState = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  postedDate: string;
  track: ListingTrack;
  image: string;
  category: string;
  department: string;
  reportsTo: string;
  workMode: string;
  experience: string;
  educationLevel: string;
  salaryRange: string;
  overview: string;
  rolePurpose: string;
  responsibilitiesText: string;
  knowHowText: string;
  problemSolvingText: string;
  qualificationsText: string;
  tagsText: string;
  benefitsText: string;
  deadline: string;
  applyUrl: string;
  instructions: string;
};

const today = new Date().toISOString().slice(0, 10);

const initialForm: JobFormState = {
  id: "",
  title: "",
  company: "",
  location: "",
  type: "",
  postedDate: today,
  track: "attachment",
  image: "/is-hiring.png",
  category: "",
  department: "",
  reportsTo: "",
  workMode: "",
  experience: "",
  educationLevel: "",
  salaryRange: "",
  overview: "",
  rolePurpose: "",
  responsibilitiesText: "",
  knowHowText: "",
  problemSolvingText: "",
  qualificationsText: "",
  tagsText: "",
  benefitsText: "",
  deadline: "",
  applyUrl: "",
  instructions: "",
};

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitComma(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createJobFromForm(form: JobFormState): JobListing {
  const responsibilities = splitLines(form.responsibilitiesText);
  const knowHow = splitLines(form.knowHowText);
  const problemSolvingAndAccountability = splitLines(form.problemSolvingText);
  const qualifications = splitLines(form.qualificationsText);
  const tags = splitComma(form.tagsText);
  const benefits = splitComma(form.benefitsText);

  const job: JobListing = {
    id: form.id.trim(),
    title: form.title.trim(),
    company: form.company.trim(),
    location: form.location.trim(),
    type: form.type.trim(),
    postedDate: form.postedDate,
    track: form.track,
    image: form.image.trim() || "/is-hiring.png",
  };

  if (form.category.trim()) job.category = form.category.trim();
  if (form.department.trim()) job.department = form.department.trim();
  if (form.reportsTo.trim()) job.reportsTo = form.reportsTo.trim();
  if (form.workMode.trim()) job.workMode = form.workMode.trim();
  if (form.experience.trim()) job.experience = form.experience.trim();
  if (form.educationLevel.trim()) job.educationLevel = form.educationLevel.trim();
  if (form.salaryRange.trim()) job.salaryRange = form.salaryRange.trim();
  if (form.overview.trim()) job.overview = form.overview.trim();
  if (form.rolePurpose.trim()) job.rolePurpose = form.rolePurpose.trim();
  if (responsibilities.length > 0) job.responsibilities = responsibilities;
  if (knowHow.length > 0) job.knowHow = knowHow;
  if (problemSolvingAndAccountability.length > 0) {
    job.problemSolvingAndAccountability = problemSolvingAndAccountability;
  }
  if (qualifications.length > 0) job.qualifications = qualifications;
  if (tags.length > 0) job.tags = tags;
  if (benefits.length > 0) job.benefits = benefits;

  if (form.deadline || form.applyUrl || form.instructions) {
    job.application = {};
    if (form.deadline) job.application.deadline = form.deadline;
    if (form.applyUrl.trim()) job.application.applyUrl = form.applyUrl.trim();
    if (form.instructions.trim()) {
      job.application.instructions = form.instructions.trim();
    }
  }

  return job;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [form, setForm] = useState<JobFormState>(initialForm);
  const [existingJobs, setExistingJobs] = useState<JobListing[]>([]);
  const [newJobs, setNewJobs] = useState<JobListing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [includeExisting, setIncludeExisting] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await fetch("/data/jobs.json");
        if (!response.ok) throw new Error("Failed to load jobs");
        const data = (await response.json()) as JobListing[];
        setExistingJobs(data);
      } catch {
        setError("Could not load existing jobs.json data.");
      }
    };

    loadJobs();
  }, []);

  // listen for auth state changes
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  const exportJobs = useMemo(() => {
    return includeExisting ? [...newJobs, ...existingJobs] : newJobs;
  }, [existingJobs, includeExisting, newJobs]);

  const exportJson = useMemo(() => {
    return `${JSON.stringify(exportJobs, null, 2)}\n`;
  }, [exportJobs]);

  // authentication helpers for email/password
  const loginWithEmail = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!auth) return;
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || "Authentication failed.");
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };


  const handleChange =
    (field: keyof JobFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const addJob = (event: FormEvent) => {
    event.preventDefault();
    setCopied(false);
    setError(null);

    if (!form.id.trim() || !form.title.trim() || !form.company.trim() || !form.location.trim() || !form.type.trim()) {
      setError("Fill all required fields: ID, title, company, location, and type.");
      return;
    }

    const duplicate = exportJobs.some((job) => job.id === form.id.trim());
    if (duplicate) {
      setError("Job ID already exists. Use a unique ID.");
      return;
    }

    const job = createJobFromForm(form);
    setNewJobs((prev) => [job, ...prev]);
    setForm((prev) => ({ ...initialForm, postedDate: prev.postedDate, track: prev.track }));
  };

  const downloadJson = () => {
    const blob = new Blob([exportJson], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "jobs.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(exportJson);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  // if not authenticated show an email/password login screen
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 text-slate-900">
        <h1 className="mb-4 text-3xl font-bold text-slate-900">Admin Login</h1>
        <form onSubmit={loginWithEmail} className="w-full max-w-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-slate-900"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-slate-900"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-blue-500 px-6 py-3 text-white transition hover:bg-blue-600"
          >
            Sign in
          </button>
        </form>
        {error && <p className="mt-4 text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#e7edf8] via-[#edf3fb] to-[#dce7f6] px-3 pb-4 pt-20 sm:px-4">
      <div className="pointer-events-none absolute -left-16 top-[-9rem] h-72 w-72 rounded-full bg-sky-400/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-8 top-20 h-56 w-56 rounded-full bg-cyan-300/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 left-1/3 h-64 w-64 rounded-full bg-indigo-300/25 blur-3xl" />

      <FloatingSocialLinks />
      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto mt-10 w-full max-w-7xl rounded-[2rem] border border-slate-300 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(2,6,23,0.35)] sm:p-8">
          <div className="rounded-xl border border-slate-600/80 bg-gradient-to-r from-slate-950 to-slate-800 px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Jobs Admin</h1>
              <p className="mt-1 text-sm text-slate-300">Fill fields, add jobs, then export a ready-to-use `jobs.json`.</p>
            </div>
            <button
              onClick={logout}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Sign out
            </button>
          </div>

          {error && <p className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <form onSubmit={addJob} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <input value={form.id} onChange={handleChange("id")} placeholder="Job ID (required)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.title} onChange={handleChange("title")} placeholder="Title (required)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.company} onChange={handleChange("company")} placeholder="Company (required)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.location} onChange={handleChange("location")} placeholder="Location (required)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.type} onChange={handleChange("type")} placeholder="Type e.g. Internship (required)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.postedDate} onChange={handleChange("postedDate")} type="date" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <select value={form.track} onChange={handleChange("track")} className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500">
                <option value="attachment">attachment</option>
                <option value="internship">internship</option>
                <option value="graduate-trainee">graduate-trainee</option>
              </select>
              <input value={form.image} onChange={handleChange("image")} placeholder="Image path e.g. /is-hiring.png" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.category} onChange={handleChange("category")} placeholder="Category" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.department} onChange={handleChange("department")} placeholder="Department" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.reportsTo} onChange={handleChange("reportsTo")} placeholder="Reports to" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.workMode} onChange={handleChange("workMode")} placeholder="Work mode" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.experience} onChange={handleChange("experience")} placeholder="Experience" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.educationLevel} onChange={handleChange("educationLevel")} placeholder="Education level" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.salaryRange} onChange={handleChange("salaryRange")} placeholder="Salary range" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <textarea value={form.rolePurpose} onChange={handleChange("rolePurpose")} placeholder="Role purpose" rows={3} className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <textarea value={form.overview} onChange={handleChange("overview")} placeholder="Overview" rows={3} className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <textarea value={form.responsibilitiesText} onChange={handleChange("responsibilitiesText")} placeholder="Responsibilities (one per line)" rows={4} className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <textarea value={form.knowHowText} onChange={handleChange("knowHowText")} placeholder="Know how (one per line)" rows={4} className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <textarea value={form.problemSolvingText} onChange={handleChange("problemSolvingText")} placeholder="Problem solving & accountability (one per line)" rows={4} className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <textarea value={form.qualificationsText} onChange={handleChange("qualificationsText")} placeholder="Qualifications (one per line)" rows={4} className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input value={form.tagsText} onChange={handleChange("tagsText")} placeholder="Tags (comma separated)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.benefitsText} onChange={handleChange("benefitsText")} placeholder="Benefits (comma separated)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.deadline} onChange={handleChange("deadline")} type="date" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
              <input value={form.applyUrl} onChange={handleChange("applyUrl")} placeholder="Apply URL" className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />
            </div>
            <textarea value={form.instructions} onChange={handleChange("instructions")} placeholder="Application instructions" rows={2} className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500" />

            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">Add job</button>
              <button type="button" onClick={() => setForm(initialForm)} className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400">Reset form</button>
              <button type="button" onClick={() => setNewJobs([])} className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400">Clear added jobs</button>
            </div>
          </form>

          <section className="mt-8 rounded-2xl border border-slate-300 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-800">
                New jobs: {newJobs.length} • Existing jobs: {existingJobs.length} • Export total: {exportJobs.length}
              </p>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={includeExisting}
                  onChange={(event) => setIncludeExisting(event.target.checked)}
                />
                Include existing jobs in export
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={downloadJson} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                Download jobs.json
              </button>
              <button type="button" onClick={copyJson} className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400">
                {copied ? "Copied JSON" : "Copy JSON"}
              </button>
            </div>

            <pre className="mt-4 max-h-[26rem] overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
              {exportJson}
            </pre>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
