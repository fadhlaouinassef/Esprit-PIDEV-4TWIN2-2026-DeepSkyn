type HeaderValue = string | string[] | null | undefined;

type HeaderSource = {
  get?: (name: string) => string | null;
} | Record<string, HeaderValue>;

export type LoginGeoInput = {
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type ResolvedLoginGeo = {
  location: string;
  latitude: number | null;
  longitude: number | null;
};

const headerCandidates = {
  ip: ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'true-client-ip'],
  city: ['x-vercel-ip-city'],
  region: ['x-vercel-ip-country-region'],
  country: ['x-vercel-ip-country', 'cf-ipcountry'],
  latitude: ['x-vercel-ip-latitude'],
  longitude: ['x-vercel-ip-longitude'],
};

const toSingleHeaderValue = (value: HeaderValue): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  if (typeof value === 'string') {
    return value;
  }
  return null;
};

const getHeader = (headers: HeaderSource, name: string): string | null => {
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }

  const direct = toSingleHeaderValue((headers as Record<string, HeaderValue>)[name]);
  if (direct) return direct;

  return toSingleHeaderValue((headers as Record<string, HeaderValue>)[name.toLowerCase()]);
};

const normalizeIp = (ip: string): string => {
  const clean = ip.trim();
  if (clean.startsWith('::ffff:')) {
    return clean.slice(7);
  }
  return clean;
};

const isLoopbackIp = (ip: string): boolean => {
  return ip === '::1' || ip === '127.0.0.1' || ip === 'localhost';
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const extractClientIp = (headers: HeaderSource): string | null => {
  for (const header of headerCandidates.ip) {
    const raw = getHeader(headers, header);
    if (!raw) continue;

    const first = raw.split(',')[0]?.trim();
    if (!first) continue;

    const ip = normalizeIp(first);
    if (!ip) continue;
    return ip;
  }

  return null;
};

const buildLabel = (city: string | null, region: string | null, country: string | null): string | null => {
  const parts = [city, region, country].filter((value): value is string => Boolean(value && value.trim()));
  if (parts.length === 0) return null;
  return parts.join(', ');
};

export const parseLoginGeoCookie = (cookieValue: string | null | undefined): LoginGeoInput | null => {
  if (!cookieValue) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(cookieValue)) as LoginGeoInput;
    return {
      location: parsed.location?.trim() || null,
      latitude: toNumberOrNull(parsed.latitude),
      longitude: toNumberOrNull(parsed.longitude),
    };
  } catch {
    return null;
  }
};

export const stringifyLoginGeoCookie = (input: LoginGeoInput): string => {
  const value = {
    location: input.location?.trim() || null,
    latitude: toNumberOrNull(input.latitude),
    longitude: toNumberOrNull(input.longitude),
  };
  return encodeURIComponent(JSON.stringify(value));
};

const lookupGeoFromIp = async (ip: string): Promise<ResolvedLoginGeo | null> => {
  if (!ip || isLoopbackIp(ip)) {
    return null;
  }

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await response.json() as {
      city?: string;
      region?: string;
      country_name?: string;
      latitude?: number;
      longitude?: number;
    };

    const latitude = toNumberOrNull(data.latitude);
    const longitude = toNumberOrNull(data.longitude);
    const location = buildLabel(data.city ?? null, data.region ?? null, data.country_name ?? null) || `IP:${ip}`;

    return {
      location,
      latitude,
      longitude,
    };
  } catch {
    return null;
  }
};

export const resolveLoginLocation = async (
  headers: HeaderSource,
  provided?: LoginGeoInput | null
): Promise<ResolvedLoginGeo> => {
  const providedLat = toNumberOrNull(provided?.latitude);
  const providedLng = toNumberOrNull(provided?.longitude);
  const providedLabel = provided?.location?.trim() || null;

  if (providedLat !== null && providedLng !== null) {
    return {
      location: providedLabel || `GPS:${providedLat.toFixed(6)},${providedLng.toFixed(6)}`,
      latitude: providedLat,
      longitude: providedLng,
    };
  }

  const city = headerCandidates.city
    .map((header) => getHeader(headers, header))
    .find((value) => Boolean(value && value.trim()))
    ?.trim() || null;

  const region = headerCandidates.region
    .map((header) => getHeader(headers, header))
    .find((value) => Boolean(value && value.trim()))
    ?.trim() || null;

  const country = headerCandidates.country
    .map((header) => getHeader(headers, header))
    .find((value) => Boolean(value && value.trim()))
    ?.trim() || null;

  const latitude = headerCandidates.latitude
    .map((header) => getHeader(headers, header))
    .map((value) => toNumberOrNull(value))
    .find((value) => value !== null) ?? null;

  const longitude = headerCandidates.longitude
    .map((header) => getHeader(headers, header))
    .map((value) => toNumberOrNull(value))
    .find((value) => value !== null) ?? null;

  const label = buildLabel(city, region, country);
  if (label || (latitude !== null && longitude !== null)) {
    return {
      location: label || `GPS:${latitude?.toFixed(6)},${longitude?.toFixed(6)}`,
      latitude,
      longitude,
    };
  }

  const ip = extractClientIp(headers);
  if (ip) {
    const ipLookup = await lookupGeoFromIp(ip);
    if (ipLookup) return ipLookup;

    if (isLoopbackIp(ip)) {
      return {
        location: 'Localhost',
        latitude: null,
        longitude: null,
      };
    }

    return {
      location: `IP:${ip}`,
      latitude: null,
      longitude: null,
    };
  }

  return {
    location: 'Unknown',
    latitude: null,
    longitude: null,
  };
};
