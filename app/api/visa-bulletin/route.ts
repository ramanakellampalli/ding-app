import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const revalidate = 86400; // 24h cache

const BULLETIN_URL = "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html";

interface BulletinData {
  month: string;
  year: string;
  url: string;
  employmentFinal: Record<string, Record<string, string>>;
  familyFinal: Record<string, Record<string, string>>;
  fetchedAt: string;
}

export async function GET() {
  try {
    // Get latest bulletin URL
    const listRes = await fetch(BULLETIN_URL, {
      signal: AbortSignal.timeout(15000),
    });
    const listHtml = await listRes.text();
    const $list = cheerio.load(listHtml);

    // Find first bulletin link
    let bulletinUrl = "";
    $list('a[href*="visa-bulletin-for"]').each((_, el) => {
      const href = $list(el).attr("href");
      if (href && !bulletinUrl) {
        bulletinUrl = href.startsWith("http")
          ? href
          : `https://travel.state.gov${href}`;
      }
    });

    if (!bulletinUrl) {
      return NextResponse.json(getMockBulletin(), {
        headers: { "Cache-Control": "public, max-age=3600" },
      });
    }

    const res = await fetch(bulletinUrl, {
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract title for month/year
    const title = $("h1, h2").first().text().trim();
    const monthMatch = title.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i);
    const yearMatch = title.match(/\b(20\d{2})\b/);
    const month = monthMatch?.[0] || "Current";
    const year = yearMatch?.[0] || new Date().getFullYear().toString();

    const tables: Record<string, Record<string, string>>[] = [];

    $("table").each((_, tableEl) => {
      const rows: Record<string, Record<string, string>> = {};
      let headers: string[] = [];
      $(tableEl)
        .find("tr")
        .each((rowI, rowEl) => {
          const cells = $(rowEl).find("td, th").map((_, c) => $(c).text().trim()).toArray();
          if (rowI === 0 || cells[0]?.match(/preference|family|employment/i)) {
            headers = cells;
          } else if (cells.length > 1 && headers.length > 1) {
            const key = cells[0];
            if (key) {
              const entry: Record<string, string> = {};
              cells.slice(1).forEach((val, idx) => {
                entry[headers[idx + 1] || `col${idx}`] = val;
              });
              rows[key] = entry;
            }
          }
        });
      if (Object.keys(rows).length > 0) tables.push(rows);
    });

    const [employmentFinal = {}, familyFinal = {}] = tables;

    const bulletin: BulletinData = {
      month,
      year,
      url: bulletinUrl,
      employmentFinal,
      familyFinal,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(bulletin, {
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error("Visa bulletin fetch error:", err);
    return NextResponse.json(getMockBulletin(), {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }
}

function getMockBulletin(): BulletinData {
  return {
    month: "April",
    year: "2026",
    url: BULLETIN_URL,
    employmentFinal: {
      "1st": { China: "01MAY22", India: "01JAN12", Mexico: "01MAY22", Philippines: "01MAY22" },
      "2nd": { China: "01JAN20", India: "22JUN12", Mexico: "01JAN20", Philippines: "01JAN20" },
      "3rd": { China: "01APR20", India: "15SEP12", Mexico: "01APR20", Philippines: "01APR20" },
      "EB-4": { China: "01JAN20", India: "01JAN20", Mexico: "22SEP16", Philippines: "22SEP16" },
      "EB-5": { China: "01SEP15", India: "01SEP15", Mexico: "Current", Philippines: "Current" },
    },
    familyFinal: {
      "F1": { China: "15JAN18", India: "15JAN18", Mexico: "22MAR02", Philippines: "22AUG13" },
      "F2A": { China: "01APR20", India: "01APR20", Mexico: "01APR20", Philippines: "01APR20" },
      "F2B": { China: "22APR15", India: "22APR15", Mexico: "15NOV02", Philippines: "08SEP12" },
      "F3": { China: "22SEP08", India: "22SEP08", Mexico: "15JAN01", Philippines: "01JAN04" },
      "F4": { China: "22JAN07", India: "22JAN05", Mexico: "22APR99", Philippines: "08DEC04" },
    },
    fetchedAt: new Date().toISOString(),
  };
}
