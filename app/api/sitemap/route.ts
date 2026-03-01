import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function GET() {
  try {
    // Read jobs.json
    const jobsPath = path.join(process.cwd(), 'public/data/jobs.json');
    const jobsData = await fs.readFile(jobsPath, 'utf-8');
    const jobs = JSON.parse(jobsData);

    // Generate sitemap XML
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://atttachmentsandinternships.vercel.app';
    const today = new Date().toISOString().split('T')[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Homepage
    xml += `  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

    // Jobs listing pages
    xml += `  <url>
    <loc>${baseUrl}/jobs</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;

    xml += `  <url>
    <loc>${baseUrl}/attachment</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;

    xml += `  <url>
    <loc>${baseUrl}/internships</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;

    xml += `  <url>
    <loc>${baseUrl}/graduate-trainees</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;

    // Individual job pages
    if (Array.isArray(jobs)) {
      jobs.forEach((job: any) => {
        if (job.id) {
          const lastmod = job.postedDate || today;
          xml += `  <url>
    <loc>${baseUrl}/jobs/${job.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
        }
      });
    }

    xml += '</urlset>';

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
