import { NextRequest, NextResponse } from 'next/server';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN!;
const ACTOR_ID = process.env.APIFY_GOOGLE_SEARCH_ACTOR ?? 'apify/google-search-scraper';

/** Cosmetic / medical product categories used to enrich queries */
const CATEGORY_KEYWORDS: Record<string, string> = {
  skincare:        'skincare product ingredients INCI',
  haircare:        'haircare product ingredients',
  sunscreen:       'sunscreen SPF product',
  serum:           'face serum cosmetic product',
  moisturizer:     'moisturizer cream cosmetic',
  cleanser:        'face cleanser cosmetic',
  toner:           'toner cosmetic skincare',
  pharmaceutical:  'pharmaceutical cosmetic product active ingredient',
  derma:           'dermatologist product derma',
  natural:         'natural organic cosmetic product',
  generic:         '',
};

export type ProductCategory = keyof typeof CATEGORY_KEYWORDS;

interface ApifyRunResponse {
  data: { id: string; defaultDatasetId: string; status: string };
}
interface ApifyDatasetItem { [key: string]: unknown }

async function waitForRun(runId: string, timeoutMs = 90_000): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );
    if (!res.ok) throw new Error(`Failed to poll run: ${res.status}`);
    const json = (await res.json()) as ApifyRunResponse;
    const { status, defaultDatasetId } = json.data;
    if (status === 'SUCCEEDED') return defaultDatasetId;
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status))
      throw new Error(`Apify run ${status}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Apify run timed out');
}

export async function POST(request: NextRequest) {
  try {
    if (!APIFY_TOKEN)
      return NextResponse.json({ error: 'APIFY_API_TOKEN not configured.' }, { status: 500 });

    const body = (await request.json().catch(() => ({}))) as {
      query?: string;
      category?: ProductCategory;
      brand?: string;
      site?: string;           // restrict to a domain e.g. "sephora.com"
      countryCode?: string;
      languageCode?: string;
      maxResults?: number;
    };

    const rawQuery = String(body.query || '').trim();
    if (!rawQuery)
      return NextResponse.json({ error: 'query is required' }, { status: 400 });

    const category = (body.category as ProductCategory) || 'generic';
    const categoryKeyword = CATEGORY_KEYWORDS[category] ?? '';

    // Build an enriched query that focuses on cosmetic/medical products
    const parts: string[] = [rawQuery];
    if (categoryKeyword) parts.push(categoryKeyword);
    if (body.brand)  parts.push(`brand:"${body.brand.trim()}"`);
    if (body.site)   parts.push(`site:${body.site.trim()}`);
    // Always anchor to product context
    parts.push('product buy ingredients');

    const enrichedQuery = parts.join(' ');
    const maxResults    = Math.min(Number(body.maxResults) || 10, 50);
    const countryCode   = String(body.countryCode || 'us');
    const languageCode  = String(body.languageCode || 'en');

    // 1. Start Apify actor run
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(ACTOR_ID)}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queries: enrichedQuery,
          maxPagesPerQuery: 1,
          resultsPerPage: maxResults,
          countryCode,
          languageCode,
        }),
      }
    );

    if (!startRes.ok) {
      const err = await startRes.text();
      return NextResponse.json({ error: `Apify start failed: ${err}` }, { status: startRes.status });
    }

    const startJson = (await startRes.json()) as ApifyRunResponse;
    const runId = startJson.data.id;

    // 2. Poll
    const datasetId = await waitForRun(runId);

    // 3. Fetch dataset
    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&clean=true&format=json`
    );
    if (!dataRes.ok)
      return NextResponse.json({ error: `Dataset fetch failed: ${dataRes.status}` }, { status: 500 });

    const rawItems = (await dataRes.json()) as ApifyDatasetItem[];

    const organicResults: unknown[] = [];
    for (const item of rawItems) {
      const organic = item.organicResults;
      if (Array.isArray(organic)) organicResults.push(...organic);
    }

    return NextResponse.json({
      query: rawQuery,
      enrichedQuery,
      category,
      totalResults: organicResults.length,
      results: organicResults.slice(0, maxResults),
      runId,
      datasetId,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('[Scraping API]', error);
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
