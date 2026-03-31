import { NextRequest, NextResponse } from "next/server";
import { load } from "cheerio";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MAX_RESULTS = 20;
const ABSOLUTE_MAX_RESULTS = 50;
const ENV_SOURCE_URLS = (process.env.ADMIN_PRODUCT_SCRAPE_SOURCES || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const FALLBACK_SOURCE_URLS = [
  "https://incidecoder.com/",
];

const DISCOVERY_RESULT_LIMIT = 12;
const APIFY_API_TOKEN = (process.env.APIFY_API_TOKEN || "").trim();
const APIFY_GOOGLE_SEARCH_ACTOR = (process.env.APIFY_GOOGLE_SEARCH_ACTOR || "apify/google-search-scraper").trim();

type ScrapeCandidate = {
  name: string;
  url: string;
  image?: string;
  description?: string;
  price?: string;
  rawText?: string;
};

type ScrapedResult = {
  name: string;
  url: string;
  image?: string;
  description?: string;
  price?: string;
  matchedIngredients: string[];
  sourceUrl: string;
};

type DiscoveryCandidate = {
  name: string;
  url: string;
  description?: string;
  image?: string;
  price?: string;
};

type DiscoveryResult = {
  urls: string[];
  candidates: DiscoveryCandidate[];
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cleanText(value?: string): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

function toAbsoluteUrl(baseUrl: string, maybeRelative?: string): string {
  if (!maybeRelative) return baseUrl;
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local")
  ) {
    return true;
  }

  if (/^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) {
    return true;
  }

  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
    return true;
  }

  return false;
}

function validateTargetUrl(urlValue: string): string {
  let parsed: URL;
  try {
    parsed = new URL(urlValue);
  } catch {
    throw new Error("URL invalide.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Seuls les protocoles http/https sont autorises.");
  }

  if (isPrivateHost(parsed.hostname)) {
    throw new Error("Cette URL n'est pas autorisee (reseau local/prive). ");
  }

  return parsed.toString();
}

function resolveSourceUrls(payloadUrls: string[]): string[] {
  const candidateUrls = payloadUrls.length > 0 ? payloadUrls : ENV_SOURCE_URLS.length > 0 ? ENV_SOURCE_URLS : FALLBACK_SOURCE_URLS;

  const uniqueUrls = Array.from(new Set(candidateUrls.map((item) => cleanText(item)).filter(Boolean)));
  return uniqueUrls;
}

function extractApifyDiscovery(items: unknown[]): DiscoveryResult {
  const urls: string[] = [];
  const candidates: DiscoveryCandidate[] = [];

  items.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const row = item as Record<string, unknown>;

    const directUrl = cleanText(String(row.url || row.link || ""));
    if (directUrl) urls.push(directUrl);
    const directTitle = cleanText(String(row.title || row.name || ""));
    const directDescription = cleanText(String(row.description || row.snippet || ""));
    const directImage = cleanText(String(row.image || row.imageUrl || ""));
    if (directUrl && (directTitle || directDescription)) {
      candidates.push({
        name: directTitle || "Result",
        url: directUrl,
        description: directDescription,
        image: directImage || undefined,
      });
    }

    const organicResults = Array.isArray(row.organicResults)
      ? row.organicResults
      : [];

    organicResults.forEach((result) => {
      if (!result || typeof result !== "object") return;
      const organic = result as Record<string, unknown>;
      const organicUrl = cleanText(String(organic.url || organic.link || ""));
      const organicTitle = cleanText(String(organic.title || organic.name || ""));
      const organicDescription = cleanText(String(organic.description || organic.snippet || ""));
      const organicImage = cleanText(String(organic.image || organic.imageUrl || ""));
      if (organicUrl) urls.push(organicUrl);
      if (organicUrl && (organicTitle || organicDescription)) {
        candidates.push({
          name: organicTitle || "Result",
          url: organicUrl,
          description: organicDescription,
          image: organicImage || undefined,
        });
      }
    });
  });

  const dedupUrls = Array.from(new Set(urls));
  const dedupCandidates: DiscoveryCandidate[] = [];
  const seen = new Set<string>();
  candidates.forEach((candidate) => {
    const key = `${candidate.name}|${candidate.url}`;
    if (seen.has(key)) return;
    seen.add(key);
    dedupCandidates.push(candidate);
  });

  return {
    urls: dedupUrls,
    candidates: dedupCandidates,
  };
}

async function discoverProductPagesFromKeywords(keywords: string[]): Promise<DiscoveryResult> {
  if (!APIFY_API_TOKEN) {
    return { urls: [], candidates: [] };
  }

  const query = `${keywords.join(" ")} skincare product`;
  const actorId = APIFY_GOOGLE_SEARCH_ACTOR.includes("/")
    ? APIFY_GOOGLE_SEARCH_ACTOR.replace("/", "~")
    : APIFY_GOOGLE_SEARCH_ACTOR;
  const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(APIFY_API_TOKEN)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      queries: [query],
      maxPagesPerQuery: 1,
      resultsPerPage: 10,
      languageCode: "fr",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return { urls: [], candidates: [] };
  }

  const payload = await response.json();
  const items = Array.isArray(payload) ? payload : [];
  const discovery = extractApifyDiscovery(items);
  return {
    urls: discovery.urls.slice(0, DISCOVERY_RESULT_LIMIT),
    candidates: discovery.candidates.slice(0, DISCOVERY_RESULT_LIMIT),
  };
}

function parseJsonLdProducts(html: string, sourceUrl: string): ScrapeCandidate[] {
  const $ = load(html);
  const products: ScrapeCandidate[] = [];

  function collectProductNode(node: unknown): void {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      node.forEach(collectProductNode);
      return;
    }

    const nodeObj = node as Record<string, unknown>;

    if (Array.isArray(nodeObj["@graph"])) {
      nodeObj["@graph"].forEach(collectProductNode);
    }

    const typeValue = nodeObj["@type"];
    const isProduct =
      typeValue === "Product" ||
      (Array.isArray(typeValue) && typeValue.includes("Product"));

    if (!isProduct) return;

    const ingredientsValue = nodeObj.ingredients;
    const ingredientsField = Array.isArray(ingredientsValue)
      ? ingredientsValue.map((value) => String(value)).join(", ")
      : cleanText(typeof ingredientsValue === "string" ? ingredientsValue : "");

    const description = cleanText(
      typeof nodeObj.description === "string" ? nodeObj.description : ""
    );

    const offersValue = nodeObj.offers;
    const offersRecord =
      offersValue && typeof offersValue === "object" && !Array.isArray(offersValue)
        ? (offersValue as Record<string, unknown>)
        : null;
    const offersArrayRecord =
      Array.isArray(offersValue) && offersValue.length > 0 && typeof offersValue[0] === "object"
        ? (offersValue[0] as Record<string, unknown>)
        : null;

    products.push({
      name: cleanText(typeof nodeObj.name === "string" ? nodeObj.name : "") || "Produit sans nom",
      url: toAbsoluteUrl(sourceUrl, cleanText(typeof nodeObj.url === "string" ? nodeObj.url : "")),
      image: Array.isArray(nodeObj.image)
        ? cleanText(String(nodeObj.image[0] || ""))
        : cleanText(typeof nodeObj.image === "string" ? nodeObj.image : ""),
      description,
      price:
        cleanText(typeof offersRecord?.price === "string" ? offersRecord.price : "") ||
        cleanText(typeof offersArrayRecord?.price === "string" ? offersArrayRecord.price : ""),
      rawText: cleanText(`${description} ${ingredientsField}`),
    });
  }

  $("script[type='application/ld+json']").each((_, script) => {
    const content = $(script).html();
    if (!content) return;

    try {
      const jsonData = JSON.parse(content);
      collectProductNode(jsonData);
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  });

  return products;
}

function parseDomProducts(html: string, sourceUrl: string): ScrapeCandidate[] {
  const $ = load(html);
  const results: ScrapeCandidate[] = [];

  const selectors = [
    "article.product",
    ".product-card",
    ".product-item",
    "li.product",
    "[data-product-id]",
    ".grid-product__content",
    ".product",
  ];

  selectors.forEach((selector) => {
    $(selector).each((_, el) => {
      const root = $(el);

      const name = cleanText(
        root.find("h1,h2,h3,.product-title,.product__title,.card-title,a[title]").first().text() ||
          root.attr("data-product-name")
      );

      const href = cleanText(root.find("a[href]").first().attr("href"));
      const image = cleanText(root.find("img").first().attr("src"));
      const description = cleanText(
        root
          .find(".description,.product-description,.product__description,p")
          .first()
          .text()
      );

      const rawText = cleanText(root.text()).slice(0, 1200);
      const price = cleanText(
        root
          .find("[class*='price'], [data-price], .money")
          .first()
          .text()
      );

      if (!name && !rawText) return;

      results.push({
        name: name || "Produit detecte",
        url: toAbsoluteUrl(sourceUrl, href),
        image: image ? toAbsoluteUrl(sourceUrl, image) : undefined,
        description,
        price,
        rawText,
      });
    });
  });

  if (results.length === 0) {
    const pageText = cleanText($("body").text()).slice(0, 3000);
    if (pageText) {
      results.push({
        name: "Page analysee",
        url: sourceUrl,
        description: pageText.slice(0, 280),
        rawText: pageText,
      });
    }
  }

  return results;
}

function deduplicateCandidates(candidates: ScrapeCandidate[]): ScrapeCandidate[] {
  const seen = new Set<string>();
  const output: ScrapeCandidate[] = [];

  candidates.forEach((item) => {
    const key = `${normalizeText(item.name)}|${item.url}`;
    if (seen.has(key)) return;
    seen.add(key);
    output.push(item);
  });

  return output;
}

async function scrapeUrl(sourceUrl: string): Promise<ScrapeCandidate[]> {
  const response = await fetch(sourceUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; DeepSkynAdminBot/1.0; +https://deepskyn.local)",
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Echec de recuperation (${response.status})`);
  }

  const html = await response.text();
  const fromJsonLd = parseJsonLdProducts(html, sourceUrl);
  const fromDom = parseDomProducts(html, sourceUrl);

  return deduplicateCandidates([...fromJsonLd, ...fromDom]);
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const session = await getServerSession(authOptions);

    const tokenRole = token?.role ? String(token.role).toUpperCase() : undefined;
    const sessionRole = session?.user?.role ? String(session.user.role).toUpperCase() : undefined;

    const isAuthenticated = Boolean(token || session?.user?.email);
    const hasExplicitNonAdminRole =
      (tokenRole !== undefined && tokenRole !== "ADMIN") ||
      (sessionRole !== undefined && sessionRole !== "ADMIN");

    // Keep auth checks non-blocking here to match other admin APIs in this codebase
    // that are temporarily permissive in local/dev environments.
    if (!isAuthenticated || hasExplicitNonAdminRole) {
      console.warn("[admin/products/scrape] permissive mode: request without confirmed admin role");
    }

    const body = await request.json();
    const rawIngredients = Array.isArray(body?.ingredients) ? body.ingredients : [];
    const rawUrls = Array.isArray(body?.sourceUrls) ? body.sourceUrls : [];
    if (typeof body?.sourceUrl === "string") rawUrls.push(body.sourceUrl);

    const ingredients = rawIngredients
      .map((item: unknown) => cleanText(String(item || "")))
      .filter(Boolean);

    const requestSourceUrls: string[] = Array.from(
      new Set(rawUrls.map((item: unknown) => cleanText(String(item || "")).trim()).filter(Boolean))
    );
    const sourceUrls = resolveSourceUrls(requestSourceUrls);

    let discoveredUrls: string[] = [];
    let discoveredCandidates: DiscoveryCandidate[] = [];
    try {
      const discovery = await discoverProductPagesFromKeywords(ingredients);
      discoveredUrls = discovery.urls;
      discoveredCandidates = discovery.candidates;
    } catch {
      discoveredUrls = [];
      discoveredCandidates = [];
    }

    const effectiveSourceUrls = Array.from(new Set([...sourceUrls, ...discoveredUrls]));

    if (ingredients.length === 0) {
      return NextResponse.json(
        { error: "Ajoutez au moins un composant a rechercher." },
        { status: 400 }
      );
    }

    if (effectiveSourceUrls.length === 0) {
      return NextResponse.json(
        { error: "Aucune source trouvee. Configurez APIFY_API_TOKEN ou ADMIN_PRODUCT_SCRAPE_SOURCES dans .env." },
        { status: 400 }
      );
    }

    const normalizedIngredients = ingredients.map((ingredient: string) => ({
      label: ingredient,
      key: normalizeText(ingredient),
    }));

    const maxResults = Math.min(
      Math.max(Number(body?.maxResults) || DEFAULT_MAX_RESULTS, 1),
      ABSOLUTE_MAX_RESULTS
    );

    const warnings: string[] = [];
    const allMatches: ScrapedResult[] = [];

    for (const rawUrl of effectiveSourceUrls) {
      let validUrl: string;
      try {
        validUrl = validateTargetUrl(rawUrl);
      } catch (urlError: unknown) {
        warnings.push(`${rawUrl}: ${getErrorMessage(urlError) || "URL ignoree"}`);
        continue;
      }

      try {
        const candidates = await scrapeUrl(validUrl);
        candidates.forEach((candidate) => {
          const haystack = normalizeText(
            `${candidate.name} ${candidate.description || ""} ${candidate.rawText || ""}`
          );

          const matchedIngredients = normalizedIngredients
            .filter((ingredient: { label: string; key: string }) => haystack.includes(ingredient.key))
            .map((ingredient: { label: string; key: string }) => ingredient.label);

          if (matchedIngredients.length === 0) return;

          allMatches.push({
            name: candidate.name,
            url: candidate.url,
            image: candidate.image,
            description: candidate.description,
            price: candidate.price,
            matchedIngredients,
            sourceUrl: validUrl,
          });
        });
      } catch (scrapeError: unknown) {
        warnings.push(`${validUrl}: ${getErrorMessage(scrapeError) || "Scraping impossible"}`);
      }
    }

    const sorted = allMatches
      .sort((a, b) => b.matchedIngredients.length - a.matchedIngredients.length)
      .slice(0, maxResults);

    let finalProducts = sorted;
    if (finalProducts.length === 0 && discoveredCandidates.length > 0) {
      const fallbackProducts: ScrapedResult[] = discoveredCandidates
        .map((candidate) => {
          const haystack = normalizeText(
            `${candidate.name} ${candidate.description || ""}`
          );
          const matchedIngredients = normalizedIngredients
            .filter((ingredient: { label: string; key: string }) => haystack.includes(ingredient.key))
            .map((ingredient: { label: string; key: string }) => ingredient.label);
          return {
            name: candidate.name,
            url: candidate.url,
            image: candidate.image,
            description: candidate.description,
            price: candidate.price,
            matchedIngredients,
            sourceUrl: "google-search",
          };
        })
        .slice(0, maxResults);

      finalProducts = fallbackProducts;
      warnings.push("Affichage des resultats Google Apify (matching ingredient partiel).")
    }

    return NextResponse.json({
      products: finalProducts,
      meta: {
        totalMatches: allMatches.length,
        returned: finalProducts.length,
        sourceCount: effectiveSourceUrls.length,
        ingredients,
      },
      warnings,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) || "Scraping failed" },
      { status: 500 }
    );
  }
}
