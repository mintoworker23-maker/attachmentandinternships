#!/usr/bin/env node

/**
 * Multi-source Job Scraper
 * Scrapes job listings from multiple sources (CampusBiz, etc.) with deep data extraction.
 * Outputs both raw listings and jobs.json-compatible format.
 *
 * Configuration:
 *   - Edit scripts/sources.json to add/modify sources
 *
 * Usage:
 *   node scripts/scrape-jobs.mjs                    # Use sources.json config
 *   node scripts/scrape-jobs.mjs --sources-config custom-sources.json
 *   node scripts/scrape-jobs.mjs --details false    # Skip detail fetching
 *   node scripts/scrape-jobs.mjs --no-dedup         # Keep duplicates
 */

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Defaults
const DEFAULT_SOURCES_CONFIG = "scripts/sources.json";
const DEFAULT_OUT = "public/data/all-jobs-raw.json";
const DEFAULT_JOBS_OUT = "public/data/all-jobs.json";
const DEFAULT_IMAGE = "/is-hiring.png";

// CLI argument parsing
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

// Text utilities
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

function guessTrack(title) {
  const value = title.toLowerCase();
  if (value.includes("graduate")) return "graduate-trainee";
  if (value.includes("intern")) return "internship";
  return "attachment";
}

// JSON-LD extraction
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

// Data extraction helpers
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

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .slice(0, 60); // Limit length for URL safety
}

function extractVacancyId(title, company) {
  // Create URL-friendly slug from job title and company
  const titleSlug = slugify(title);
  const companySlug = slugify(company);
  return `${titleSlug}-${companySlug}`.slice(0, 100);
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

// RSS parsing
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
    if (description) listing.summary = stripTags(description);
    results.push(listing);
  }

  return results;
}

// Detail scraping
async function fetchText(url, retries = 2) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          accept: "application/rss+xml,application/xml,text/xml,text/html,application/xhtml+xml",
        },
        timeout: 10000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      return response.text();
    } catch (error) {
      if (attempt < retries - 1) {
        console.warn(`  Retry ${attempt + 1}/${retries - 1} for ${url}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        throw error;
      }
    }
  }
}

async function scrapeListingDetail(listing, delayMs = 500) {
  try {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
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
      workMode: pickWorkMode(rawJobPosting, location),
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

// Jobs.json format conversion
function toJobsJsonRecord(listing, index) {
  const detail = listing.detail ?? {};
  const postedDate =
    toDateString(detail.datePosted) || toDateString(listing.publishedAt) || new Date().toISOString().slice(0, 10);

  const title = detail.title || listing.title;
  const location = detail.location || "Kenya";
  const company = detail.company || inferCompany(title);

  const job = {
    id: extractVacancyId(title, company),
    title,
    company,
    location,
    type: detail.type || inferType(listing.trackGuess),
    postedDate,
    track: listing.trackGuess,
    image: DEFAULT_IMAGE,
    category: detail.category || "",
    department: detail.department || "",
    reportsTo: detail.reportsTo || "",
    workMode: detail.workMode || "On-site",
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
      instructions: "Apply via the source listing URL.",
    },
    source: listing.source,
    sourceUrl: listing.url,
  };

  // Remove empty optional fields
  const optionalFields = [
    "category",
    "department",
    "reportsTo",
    "experience",
    "educationLevel",
    "salaryRange",
    "rolePurpose",
  ];
  for (const key of optionalFields) {
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

// File I/O
async function loadSourcesConfig(configPath) {
  try {
    const absolutePath = path.resolve(configPath);
    const content = await readFile(absolutePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load sources config from ${configPath}:`, error.message);
    throw error;
  }
}

async function writeJson(filePath, value) {
  const absoluteOut = path.resolve(filePath);
  await mkdir(path.dirname(absoluteOut), { recursive: true });
  await writeFile(absoluteOut, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return absoluteOut;
}

// Main scraping logic
async function scrapeSource(source, config) {
  console.log(`\n📡 Scraping: ${source.name}`);
  console.log(`   URL: ${source.url}`);

  try {
    const body = await fetchText(source.url);
    const isRss = /<rss[\s>]/i.test(body) || /<channel[\s>]/i.test(body) || /<item[\s>]/i.test(body);

    let listings = extractJobsFromRss(body, source.url);
    listings = listings.map((l) => ({ ...l, source: source.name.split(" ")[0].toLowerCase() }));

    console.log(`   Found: ${listings.length} listings`);

    // Enrich with details if enabled
    if (config.options.fetchDetails) {
      console.log(`   📄 Fetching details...`);
      const enriched = [];
      for (let i = 0; i < listings.length; i++) {
        const result = await scrapeListingDetail(listings[i], config.options.delayBetweenRequests);
        enriched.push({
          ...listings[i],
          detailStatus: result.status,
          detailError: result.error,
          detail: result.detail,
        });
        process.stdout.write(`\r   Progress: ${i + 1}/${listings.length}`);
      }
      console.log(""); // newline
      const okCount = enriched.filter((l) => l.detailStatus === "ok").length;
      console.log(`   ✓ Retrieved details for ${okCount}/${enriched.length} listings`);
      return enriched;
    }

    return listings;
  } catch (error) {
    console.error(`   ✗ Failed:`, error.message);
    return [];
  }
}

async function deduplicateListings(allListings) {
  const seen = new Set();
  const deduped = [];

  for (const listing of allListings) {
    if (!seen.has(listing.url)) {
      seen.add(listing.url);
      deduped.push(listing);
    }
  }

  return deduped;
}

// Main function
async function run() {
  const sourcesConfigPath = getArg("--sources-config", DEFAULT_SOURCES_CONFIG);
  const rawOutPath = getArg("--out", DEFAULT_OUT);
  const jobsOutPath = getArg("--jobs-out", DEFAULT_JOBS_OUT);
  const withDetails = getBoolArg("--details", true);
  const doDeduplicate = getBoolArg("--dedup", true);

  console.log("🚀 Multi-Source Job Scraper\n");

  // Load configuration
  const sourcesConfig = await loadSourcesConfig(sourcesConfigPath);
  console.log(`📋 Sources config: ${sourcesConfigPath}`);
  console.log(`   Total sources: ${sourcesConfig.sources.length}`);
  console.log(`   Details enabled: ${withDetails}`);
  console.log(`   Deduplication: ${doDeduplicate}\n`);

  // Override config with CLI args
  const config = {
    ...sourcesConfig,
    options: {
      ...sourcesConfig.options,
      fetchDetails: withDetails,
    },
  };

  // Scrape all sources
  let allListings = [];
  for (const source of sourcesConfig.sources) {
    const listings = await scrapeSource(source, config);
    allListings = allListings.concat(listings);
  }

  console.log(`\n📊 Total listings: ${allListings.length}`);

  // Deduplicate if requested
  if (doDeduplicate) {
    allListings = await deduplicateListings(allListings);
    console.log(`✓ After deduplication: ${allListings.length}`);
  }

  // Save raw data
  const rawPayload = {
    scrapedAt: new Date().toISOString(),
    sourcesCount: sourcesConfig.sources.length,
    totalListings: allListings.length,
    listings: allListings,
  };

  const rawOut = await writeJson(rawOutPath, rawPayload);
  console.log(`\n💾 Raw data saved: ${rawOut}`);

  // Convert to jobs.json format
  const jobsJsonRecords = allListings.map((item, index) => toJobsJsonRecord(item, index));

  const jobsOut = await writeJson(jobsOutPath, jobsJsonRecords);
  console.log(`💾 jobs.json format saved: ${jobsOut}`);

  // Summary stats
  if (withDetails) {
    const okCount = allListings.filter((l) => l.detailStatus === "ok").length;
    const failedCount = allListings.filter((l) => l.detailStatus === "failed").length;
    const partialCount = allListings.filter((l) => l.detailStatus === "partial").length;
    console.log(`\n📈 Detail scrape status:`);
    console.log(`   ✓ OK: ${okCount}`);
    console.log(`   ⚠ Partial: ${partialCount}`);
    console.log(`   ✗ Failed: ${failedCount}`);
  }

  console.log(`\n✨ Scraping complete!`);
}

run().catch((error) => {
  console.error("\n❌ Scrape failed:", error.message);
  process.exitCode = 1;
});
