const ALLOWED_ORIGINS = [
  /^https:\/\/(.*\.)?worldmonitor\.app$/,
  /^https:\/\/worldmonitor-[a-z0-9-]+-eliewm\.vercel\.app$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/,
];
const API_ORIGIN = 'https://api.worldmonitor.app';
const ROMANIA_FEEDS = [
  { name: 'Digi24', url: 'https://www.digi24.ro/rss' },
  { name: 'HotNews', url: 'https://www.hotnews.ro/rss' },
  { name: 'G4Media', url: 'https://www.g4media.ro/feed/' },
];
const CATEGORY_RULES = {
  politics: /\b(guvern|parlament|pre[șs]ed|aleger|partid|politic|minister|guvernare)\b/i,
  economics: /\b(econom|finan|burs|bnr|infla|tax|buget|salari|investi|compani)\b/i,
  military: /\b(militar|armata|ap[aă]rare|nato|rache|soldat|f-16|f16|dron|aerian)\b/i,
};
const ROMANIA_BBOX = { lamin: 43.5, lomin: 20.2, lamax: 48.3, lomax: 29.8 };
const digestCache = { value: null, expiresAt: 0 };
const aircraftCache = { value: null, expiresAt: 0 };
const CACHE_TTL_MS = 60_000;

function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const normalized = url.origin;
    if (ALLOWED_ORIGINS.some((pattern) => pattern.test(normalized))) return true;
    const host = url.hostname.replace(/\.+$/, '');
    const suffix = '.translate.goog';
    if (url.protocol !== 'https:' || !host.endsWith(suffix)) return false;
    const encoded = host.slice(0, -suffix.length);
    const decoded = encoded.replace(/--/g, '\0').replace(/-/g, '.').replace(/\0/g, '-');
    return decoded === 'worldmonitor.app' || decoded.endsWith('.worldmonitor.app');
  } catch {
    return false;
  }
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : 'https://worldmonitor.app',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-WorldMonitor-Key, X-Api-Key, X-Widget-Key, X-Pro-Key, X-WorldMonitor-Desktop-Timestamp, X-WorldMonitor-Desktop-Signature, Idempotency-Key, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, HEAD, OPTIONS',
    'Access-Control-Expose-Headers': 'Mcp-Session-Id, WWW-Authenticate, Retry-After, Idempotency-Key, Idempotent-Replayed, X-Billing-Verification, RateLimit, RateLimit-Policy, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-RateLimit-Mode, X-WorldMonitor-Bbox, X-WorldMonitor-Bbox-Missing, X-WorldMonitor-Bbox-Invalid, X-Military-Bbox, Link, Deprecation, Sunset',
    Vary: 'Origin',
  };
}

function jsonResponse(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function xmlTag(item, tag) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeXml(match[1].replace(/<[^>]+>/g, '').trim()) : '';
}

function parseFeed(xml, source) {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0, 20).map((match) => {
    const item = match[1];
    const title = xmlTag(item, 'title');
    const link = xmlTag(item, 'link') || xmlTag(item, 'guid');
    const published = xmlTag(item, 'pubDate') || xmlTag(item, 'published') || xmlTag(item, 'date');
    const text = `${title} ${xmlTag(item, 'description')}`;
    return {
      source,
      title,
      link,
      publishedAt: published ? Date.parse(published) || Date.now() : Date.now(),
      isAlert: CATEGORY_RULES.military.test(text),
      locationName: 'România',
      snippet: xmlTag(item, 'description').slice(0, 300),
      text,
    };
  }).filter((item) => item.title && item.link);
}

async function listRomaniaFeedDigest() {
  if (digestCache.value && digestCache.expiresAt > Date.now()) return digestCache.value;
  const results = await Promise.allSettled(ROMANIA_FEEDS.map(async (feed) => {
    const response = await fetch(feed.url, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`${feed.name} returned ${response.status}`);
    return parseFeed(await response.text(), feed.name);
  }));
  const items = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  const categories = { politics: [], economics: [], military: [], general: [] };
  for (const item of items) {
    const category = Object.entries(CATEGORY_RULES).find(([, rule]) => rule.test(item.text))?.[0] || 'general';
    const { text, ...publicItem } = item;
    categories[category].push(publicItem);
  }
  const digest = {
    categories: Object.fromEntries(Object.entries(categories).map(([key, value]) => [key, { items: value }])),
    feedStatuses: Object.fromEntries(ROMANIA_FEEDS.map((feed, index) => [
      feed.name,
      results[index].status === 'fulfilled' ? 'ok' : 'error',
    ])),
    generatedAt: new Date().toISOString(),
  };
  digestCache.value = digest;
  digestCache.expiresAt = Date.now() + CACHE_TTL_MS;
  return digest;
}

function parseOpenSkyStates(states) {
  return states
    .filter((state) => Array.isArray(state) && state[5] != null && state[6] != null)
    .map((state) => ({
      icao24: String(state[0] || ''),
      callsign: String(state[1] || '').trim(),
      lat: Number(state[6]),
      lon: Number(state[5]),
      altitudeM: Number(state[7] || 0),
      groundSpeedKts: Number(state[9] || 0) * 1.944,
      trackDeg: Number(state[10] || 0),
      verticalRate: Number(state[11] || 0),
      onGround: Boolean(state[8]),
      source: 'POSITION_SOURCE_OPENSKY',
      observedAt: Number(state[4] || Date.now() / 1000) * 1000,
    }));
}

async function trackRomaniaAircraft() {
  if (aircraftCache.value && aircraftCache.expiresAt > Date.now()) return aircraftCache.value;
  const params = new URLSearchParams(Object.entries(ROMANIA_BBOX).map(([key, value]) => [key, String(value)]));
  const response = await fetch(`https://opensky-network.org/api/states/all?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`OpenSky returned ${response.status}`);
  const payload = await response.json();
  const result = {
    positions: parseOpenSkyStates(payload.states || []),
    source: 'opensky',
    updatedAt: Date.now(),
  };
  aircraftCache.value = result;
  aircraftCache.expiresAt = Date.now() + CACHE_TTL_MS;
  return result;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (url.pathname === '/health' && ['GET', 'HEAD'].includes(request.method)) {
      if (request.method === 'HEAD') {
        return new Response(null, { status: 200, headers: corsHeaders(request) });
      }
      return jsonResponse(request, {
        ok: true,
        service: 'romonitor-api',
        stage: 'health-only',
      });
    }

    if (url.pathname.startsWith('/api/news/')) {
      if (url.pathname === '/api/news/v1/list-feed-digest' && request.method === 'GET') {
        try {
          return jsonResponse(request, await listRomaniaFeedDigest());
        } catch (error) {
          console.error('Romania news digest failed', error);
          return jsonResponse(request, { error: 'News feeds unavailable' }, 503);
        }
      }
      const upstreamUrl = new URL(url.pathname + url.search, API_ORIGIN);
      const upstreamRequest = new Request(upstreamUrl, request);
      const response = await fetch(upstreamRequest);
      const headers = new Headers(response.headers);
      for (const [name, value] of Object.entries(corsHeaders(request))) {
        headers.set(name, value);
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    if (url.pathname === '/api/aviation/v1/track-aircraft' && request.method === 'GET') {
      try {
        return jsonResponse(request, await trackRomaniaAircraft());
      } catch (error) {
        console.error('Romania aircraft tracking failed', error);
        return jsonResponse(request, {
          positions: [],
          source: 'none',
          updatedAt: Date.now(),
        }, 503);
      }
    }

    return jsonResponse(request, { error: 'Not found' }, 404);
  },
};

export { isAllowedOrigin, corsHeaders };
