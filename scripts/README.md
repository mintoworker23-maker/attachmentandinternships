# Job Scraper Documentation

This directory contains multi-source job scrapers for the job-posting-website.

## Files

- **`scrape-jobs.mjs`** - Enhanced multi-source scraper (recommended)
- **`scrape-campusbiz-jobs.mjs`** - Original CampusBiz-only scraper (legacy)
- **`sources.json`** - Configuration for data sources

## Quick Start

### Run the Enhanced Multi-Source Scraper

```bash
# Install dependencies (if not done)
npm install

# Run with full details extraction (slower but more complete)
npm run scrape:jobs

# Run fast mode (no detail extraction)
npm run scrape:jobs:no-details
```

### Output Files

- **`public/data/all-jobs-raw.json`** - Raw scraped data with metadata
- **`public/data/all-jobs.json`** - Jobs in `jobs.json` format (ready to use)

## Adding New Sources

Edit `scripts/sources.json` to add new data sources:

```json
{
  "sources": [
    {
      "name": "YourSource - Category",
      "url": "https://example.com/jobs/feed.xml",
      "type": "rss",
      "track": "attachment"
    }
  ],
  "options": {
    "fetchDetails": true,
    "detailTimeout": 10000,
    "retryAttempts": 2,
    "delayBetweenRequests": 500
  }
}
```

### Source Configuration

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Display name for the source | `"CampusBiz - Attachments"` |
| `url` | Feed or page URL to scrape | RSS feeds work best |
| `type` | Feed type: `"rss"` or `"html"` | `"rss"` |
| `track` | Job track: `"attachment"`, `"internship"`, or `"graduate-trainee"` | `"attachment"` |

### Global Options

| Option | Type | Description |
|--------|------|-------------|
| `fetchDetails` | boolean | Visit each job detail page for richer data |
| `detailTimeout` | number | Timeout per detail request (ms) |
| `retryAttempts` | number | Retry failed requests this many times |
| `delayBetweenRequests` | number | Delay between detail requests (ms) |

## Usage Examples

### Run with Custom Config

```bash
node scripts/scrape-jobs.mjs --sources-config my-sources.json
```

### Control Output Location

```bash
node scripts/scrape-jobs.mjs \
  --out public/data/raw.json \
  --jobs-out public/data/jobs.json
```

### Skip Details (Faster)

```bash
npm run scrape:jobs:no-details
```

### Disable Deduplication

```bash
node scripts/scrape-jobs.mjs --no-dedup
```

## How It Works

1. **Load Sources** – Reads `sources.json` configuration
2. **Fetch Feeds** – Scrapes RSS/HTML from each source
3. **Parse Listings** – Extracts job listings (title, URL, track)
4. **Fetch Details** *(optional)* – Visits each job's detail page to extract:
   - Full job description
   - Company information
   - Location details
   - Salary range
   - Qualifications & responsibilities
   - Benefits
   - Application deadline
5. **Deduplicate** – Removes duplicate URLs across sources
6. **Convert Format** – Transforms to `jobs.json` schema
7. **Save Output** – Writes raw and formatted data

## Supported Data Sources

### CampusBiz (Configured by Default)

CampusBiz provides RSS feeds for different job categories:

```
https://campusbiz.co.ke/careers?feed=job_feed&job_types=attachment
https://campusbiz.co.ke/careers?feed=job_feed&job_types=internship
https://campusbiz.co.ke/careers?feed=job_feed&job_types=graduate_trainee
```

Each listing links to a detail page with JSON-LD structured data for automatic extraction.

### Adding More Sources

You can add any RSS feed or HTML page with job listings. The scraper will:
- Extract titles and links from RSS/HTML
- Follow detail links to extract structured data via JSON-LD `JobPosting` schema (if available)
- Fall back to basic extraction if JSON-LD is missing

## Troubleshooting

### No listings found

- Check the source URL is correct
- Verify the feed is still active
- Try manually visiting the URL in a browser
- Check network logs: `node scripts/scrape-jobs.mjs 2>&1 | grep -i error`

### Missing company names or locations

- The scraper extracts from JSON-LD schema when available
- If the source doesn't provide structured data, you'll see "Not specified"
- This can be manually cleaned up in a post-processing step

### Slow performance

- Use `npm run scrape:jobs:no-details` to skip detail fetching
- Increase `delayBetweenRequests` to avoid rate limiting
- Reduce `retryAttempts` to fail faster on unavailable pages

### Rate limiting or blocked

- Add delays: edit `sources.json` and increase `delayBetweenRequests`
- Spread scrapes over time using cron: `0 2 * * * npm run scrape:jobs`
- Contact the source site to request an API key or official feed

## Output Schema

See `public/data/all-jobs.json` for the complete schema. Key fields:

```typescript
{
  id: string;                          // Unique identifier
  title: string;                       // Job title
  company: string;                     // Company name
  location: string;                    // Location
  type: string;                        // "Attachment", "Internship", etc.
  postedDate: string;                  // YYYY-MM-DD
  track: "attachment" | "internship" | "graduate-trainee";
  image: string;                       // Image path
  workMode?: string;                   // "On-site", "Remote", etc.
  overview?: string;                   // Job description
  responsibilities?: string[];         // List of responsibilities
  qualifications?: string[];           // Required qualifications
  tags?: string[];                     // Skills/tags
  benefits?: string[];                 // Benefits
  application: {
    applyUrl: string;                  // Application link
    deadline?: string;                 // YYYY-MM-DD
    instructions?: string;             // How to apply
  };
  source: string;                      // Source name
  sourceUrl: string;                   // Original job URL
}
```

## Performance Benchmarks

- **Fast mode** (no details): ~20 jobs in 10-15 seconds
- **Full mode** (with details): ~20 jobs in 3-5 minutes (includes 500ms delay per request)

Adjust `delayBetweenRequests` to slow down or speed up.

## License

Same as job-posting-website.
