#!/usr/bin/env node

/**
 * Scrapes job listings from CampusBiz (RSS preferred, HTML fallback)
 * and can enrich each listing by visiting its detail page.
 *
 * Usage:
 *   node scripts/scrape-campusbiz-jobs.mjs
 *   node scripts/scrape-campusbiz-jobs.mjs --details false
 *   node scripts/scrape-campusbiz-jobs.mjs --out public/data/campusbiz-jobs.json --details-out public/data/campusbiz-jobs-detailed.json --jobs-out public/data/campusbiz-jobs-as-jobsjson.json
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_URL =
  "https://campusbiz.co.ke/careers?feed=job_feed&job_types=attachment&search_location&job_categories&search_keywords";
const DEFAULT_OUT = "public/data/campusbiz-jobs.json";
const DEFAULT_DETAILS_OUT = "public/data/campusbiz-jobs-detailed.json";
const DEFAULT_JOBS_OUT = "public/data/campusbiz-jobs-as-jobsjson.json";
const DEFAULT_IMAGE = "/is-hiring.png";

function getArg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return fallback;
}

function getBoolArg(name, fallback = false) {
  const value = getArg(name, fallback ? "true" : "false");
  return String(value).toLowerCase() !== "false";
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "-")
    .replace(/&#8230;/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function guessTrack(title) {
  const value = title.toLowerCase();
  if (value.includes("graduate")) return "graduate-trainee";
  if (value.includes("intern")) return "internship";
  return "attachment";
}

function decodeXmlText(value) {
  return stripTags(
    value
      .replace(/<!\[CDATA\[/g, "")
      .replace(/\]\]>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
  );
}

function cleanListingTitle(value) {
  return value
    .replace(/\s+NEW\s*$/i, "")
    .replace(/\s+Closes on.+$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function pickFirstTagValue(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = xml.match(regex);
  return match ? decodeXmlText(match[1]) : "";
}

function extractJobsFromRss(xml, sourceUrl) {
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  const results = [];
  const seenByUrl = new Set();

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = cleanListingTitle(pickFirstTagValue(item, "title"));
    const link = pickFirstTagValue(item, "link");
    const publishedAt = pickFirstTagValue(item, "pubDate");
    const description = pickFirstTagValue(item, "description");

    const url = normalizeUrl(link, sourceUrl);
    if (!title || !url) continue;
    if (seenByUrl.has(url)) continue;
    seenByUrl.add(url);

    const listing = {
      title,
      url,
      trackGuess: guessTrack(title),
      source: "campusbiz.co.ke",
    };

    if (publishedAt) listing.publishedAt = publishedAt;
    if (description) listing.summary = description;
    results.push(listing);
  }

  return results;
}

function extractJobsFromHtml(html, sourceUrl) {
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const results = [];
  const seenByUrl = new Set();

  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const rawTitle = match[2];

    const url = normalizeUrl(href, sourceUrl);
    const title = cleanListingTitle(stripTags(rawTitle));

    if (!url || !title) continue;
    if (!url.includes("campusbiz.co.ke")) continue;

    const isVacancyUrl = /\/careers\/vacancy\/\d+-/i.test(url);
    if (!isVacancyUrl) continue;

    if (seenByUrl.has(url)) continue;
    seenByUrl.add(url);

    results.push({
      title,
      url,
      trackGuess: guessTrack(title),
      source: "campusbiz.co.ke",
    });
  }

  return results;
}

function getScriptJsonLdBlocks(html) {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    blocks.push(match[1].trim());
  }

  return blocks;
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function flattenJsonLd(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (typeof value !== "object") return [];
  if (Array.isArray(value["@graph"])) return value["@graph"].flatMap(flattenJsonLd);
  return [value];
}

function findJobPostingObject(html) {
  const blocks = getScriptJsonLdBlocks(html);

  for (const block of blocks) {
    const parsed = safeJsonParse(block);
    if (!parsed) continue;

    const entries = flattenJsonLd(parsed);
    const jobPosting = entries.find((entry) => {
      const type = entry?.["@type"];
      if (Array.isArray(type)) return type.some((item) => String(item).toLowerCase() === "jobposting");
      return String(type || "").toLowerCase() === "jobposting";
    });

    if (jobPosting) return jobPosting;
  }

  return null;
}

function pickText(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.map(pickText).filter(Boolean).join("; ");
  if (typeof value === "object") return "";
  return stripTags(String(value));
}

function pickArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => pickText(item)).filter(Boolean);
  const text = pickText(value);
  if (!text) return [];
  return text
    .split(/\s*[•\n\r]+\s*|\s*;\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toDateString(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function extractVacancyId(url, fallbackIndex) {
  const match = url.match(/\/vacancy\/(\d+)-/i);
  if (match) return `cb-${match[1]}`;
  return `cb-${String(fallbackIndex + 1).padStart(4, "0")}`;
}

function inferCompany(title) {
  const atMatch = title.match(/\s+at\s+(.+)$/i);
  if (atMatch) return atMatch[1].trim();
  return "Not specified";
}

function inferType(track) {
  if (track === "internship") return "Internship";
  if (track === "graduate-trainee") return "Graduate Program";
  return "Attachment";
}

function extractLocationFromJobPosting(jobPosting) {
  const location = jobPosting?.jobLocation;
  if (!location) return "Kenya";

  const list = Array.isArray(location) ? location : [location];
  const first = list[0];
  const address = first?.address;
  if (!address) return "Kenya";

  const locality = pickText(address.addressLocality);
  const region = pickText(address.addressRegion);
  const country = pickText(address.addressCountry) || "Kenya";
  const parts = [locality, region, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Kenya";
}

function extractSalary(jobPosting) {
  const baseSalary = jobPosting?.baseSalary;
  if (!baseSalary) return "";

  const value = baseSalary?.value || baseSalary;
  const min = pickText(value?.minValue);
  const max = pickText(value?.maxValue);
  const unit = pickText(value?.unitText || value?.unitCode);
  const currency = pickText(value?.currency || baseSalary?.currency);

  if (min && max) {
    return `${currency ? `${currency} ` : ""}${min} - ${max}${unit ? ` ${unit}` : ""}`.trim();
  }

  return pickText(baseSalary);
}

function pickWorkMode(jobPosting, locationText) {
  const direct = pickText(jobPosting?.jobLocationType);
  if (direct) return direct;
  if (locationText.toLowerCase().includes("remote")) return "Remote";
  return "On-site";
}

function toDetailedListing(baseListing, detail) {
  return {
    ...baseListing,
    ...detail,
  };
}

function toJobsJsonRecord(listing, index) {
  const detail = listing.detail ?? {};
  const postedDate =
    toDateString(detail.datePosted) || toDateString(listing.publishedAt) || new Date().toISOString().slice(0, 10);

  const title = detail.title || listing.title;
  const location = detail.location || "Kenya";

  const job = {
    id: extractVacancyId(listing.url, index),
    title,
    company: detail.company || inferCompany(title),
    location,
    type: detail.type || inferType(listing.trackGuess),
    postedDate,
    track: listing.trackGuess,
    image: DEFAULT_IMAGE,
    category: detail.category || "",
    department: detail.department || "",
    reportsTo: detail.reportsTo || "",
    workMode: detail.workMode || pickWorkMode(detail.rawJobPosting || {}, location),
    experience: detail.experience || "",
    educationLevel: detail.educationLevel || "",
    salaryRange: detail.salaryRange || "",
    overview: detail.overview || listing.summary || "",
    rolePurpose: detail.rolePurpose || "",
    responsibilities: detail.responsibilities || [],
    knowHow: detail.knowHow || [],
    problemSolvingAndAccountability: detail.problemSolvingAndAccountability || [],
    qualifications: detail.qualifications || [],
    tags: detail.tags || [],
    benefits: detail.benefits || [],
    application: {
      deadline: toDateString(detail.validThrough),
      applyUrl: listing.url,
      instructions: "Apply via the CampusBiz listing URL.",
    },
    source: "campusbiz.co.ke",
    sourceUrl: listing.url,
  };

  // Remove empty optional values so output stays clean.
  for (const key of [
    "category",
    "department",
    "reportsTo",
    "experience",
    "educationLevel",
    "salaryRange",
    "rolePurpose",
  ]) {
    if (!job[key]) delete job[key];
  }

  if (!job.overview) delete job.overview;
  if (!job.responsibilities.length) delete job.responsibilities;
  if (!job.knowHow.length) delete job.knowHow;
  if (!job.problemSolvingAndAccountability.length) delete job.problemSolvingAndAccountability;
  if (!job.qualifications.length) delete job.qualifications;
  if (!job.tags.length) delete job.tags;
  if (!job.benefits.length) delete job.benefits;

  if (!job.application.deadline) delete job.application.deadline;
  if (!job.application.instructions) delete job.application.instructions;

  return job;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      accept: "application/rss+xml,application/xml,text/xml,text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status} ${response.statusText})`);
  }

  return response.text();
}

async function scrapeListingDetail(listing) {
  try {
    const html = await fetchText(listing.url);
    const rawJobPosting = findJobPostingObject(html);

    if (!rawJobPosting) {
      return {
        status: "partial",
        detail: {},
      };
    }

    const company = pickText(rawJobPosting.hiringOrganization?.name || rawJobPosting.hiringOrganization);
    const location = extractLocationFromJobPosting(rawJobPosting);
    const overview = pickText(rawJobPosting.description);

    const qualifications = [
      ...pickArray(rawJobPosting.qualifications),
      ...pickArray(rawJobPosting.educationRequirements),
      ...pickArray(rawJobPosting.experienceRequirements),
    ];

    const detail = {
      rawJobPosting,
      title: pickText(rawJobPosting.title),
      company,
      location,
      datePosted: pickText(rawJobPosting.datePosted),
      validThrough: pickText(rawJobPosting.validThrough),
      type: pickText(rawJobPosting.employmentType),
      category: pickText(rawJobPosting.industry || rawJobPosting.occupationalCategory),
      workMode: pickText(rawJobPosting.jobLocationType),
      salaryRange: extractSalary(rawJobPosting),
      overview,
      rolePurpose: "",
      responsibilities: pickArray(rawJobPosting.responsibilities),
      qualifications: Array.from(new Set(qualifications)).filter(Boolean),
      tags: pickArray(rawJobPosting.skills),
      educationLevel: pickText(rawJobPosting.educationRequirements),
      experience: pickText(rawJobPosting.experienceRequirements),
      knowHow: [],
      problemSolvingAndAccountability: [],
      benefits: pickArray(rawJobPosting.jobBenefits),
    };

    return {
      status: "ok",
      detail,
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      detail: {},
    };
  }
}

async function enrichListingsWithDetails(listings) {
  const results = [];

  for (const listing of listings) {
    const detailResult = await scrapeListingDetail(listing);
    results.push(
      toDetailedListing(listing, {
        detailStatus: detailResult.status,
        detailError: detailResult.error,
        detail: detailResult.detail,
      })
    );
  }

  return results;
}

async function writeJson(filePath, value) {
  const absoluteOut = path.resolve(filePath);
  await mkdir(path.dirname(absoluteOut), { recursive: true });
  await writeFile(absoluteOut, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return absoluteOut;
}

async function run() {
  const url = getArg("--url", DEFAULT_URL);
  const outputPath = getArg("--out", DEFAULT_OUT);
  const detailsOutPath = getArg("--details-out", DEFAULT_DETAILS_OUT);
  const jobsOutPath = getArg("--jobs-out", DEFAULT_JOBS_OUT);
  const withDetails = getBoolArg("--details", true);

  const body = await fetchText(url);
  const isRss = /<rss[\s>]/i.test(body) || /<channel[\s>]/i.test(body) || /<item[\s>]/i.test(body);
  const listings = isRss ? extractJobsFromRss(body, url) : extractJobsFromHtml(body, url);

  const basePayload = {
    sourceUrl: url,
    scrapedAt: new Date().toISOString(),
    sourceType: isRss ? "rss" : "html",
    total: listings.length,
    listings,
  };

  const outMain = await writeJson(outputPath, basePayload);
  console.log(`Saved base feed: ${outMain}`);

  if (!withDetails) {
    console.log(`Scraped ${listings.length} listing(s) without details.`);
    return;
  }

  const detailedListings = await enrichListingsWithDetails(listings);
  const detailedPayload = {
    ...basePayload,
    detailedAt: new Date().toISOString(),
    listings: detailedListings,
  };

  const jobsJsonRecords = detailedListings.map((item, index) => toJobsJsonRecord(item, index));

  const outDetails = await writeJson(detailsOutPath, detailedPayload);
  const outJobs = await writeJson(jobsOutPath, jobsJsonRecords);

  const okCount = detailedListings.filter((item) => item.detailStatus === "ok").length;
  const failedCount = detailedListings.filter((item) => item.detailStatus === "failed").length;

  console.log(`Detailed listings saved: ${outDetails}`);
  console.log(`jobs.json-compatible data saved: ${outJobs}`);
  console.log(`Detail scrape status: ok=${okCount}, failed=${failedCount}, total=${detailedListings.length}`);
}

run().catch((error) => {
  console.error("Scrape failed:", error.message);
  process.exitCode = 1;
});
