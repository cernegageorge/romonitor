import { strict as assert } from 'node:assert';
import test from 'node:test';
import worker from './src/index.js';

test('health endpoint returns an operational JSON response', async () => {
  const response = await worker.fetch(new Request('https://romonitor-api.example/health'));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: 'romonitor-api',
    stage: 'health-only',
  });
});

test('unknown paths return 404', async () => {
  const response = await worker.fetch(new Request('https://romonitor-api.example/api/news'));

  assert.equal(response.status, 404);
});

test('OPTIONS returns the CORS preflight response', async () => {
  const response = await worker.fetch(new Request('https://romonitor-api.example/health', {
    method: 'OPTIONS',
    headers: { Origin: 'https://worldmonitor.app' },
  }));

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://worldmonitor.app');
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
});

test('CORS accepts Google Translate first-party origins', async () => {
  const response = await worker.fetch(new Request('https://romonitor-api.example/health', {
    headers: { Origin: 'https://www-worldmonitor-app.translate.goog' },
  }));
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://www-worldmonitor-app.translate.goog');
});

test('news requests are forwarded to the current API origin', async () => {
  const originalFetch = globalThis.fetch;
  let forwardedUrl;
  try {
    globalThis.fetch = async (request) => {
      forwardedUrl = request.url;
      return new Response('upstream', { status: 200 });
    };
    const response = await worker.fetch(new Request(
      'https://romonitor-api.example/api/news/v1/summarize-article',
    ));
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'upstream');
    assert.equal(
      forwardedUrl,
      'https://api.worldmonitor.app/api/news/v1/summarize-article',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Romania digest parses RSS feeds without the Vercel origin', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (request) => new Response(`<rss><channel><item>
      <title>Guvernul anunță măsuri pentru economie</title>
      <link>https://example.test/story</link>
      <description>Știre România</description>
      <pubDate>Wed, 03 Sep 2026 10:00:00 GMT</pubDate>
    </item></channel></rss>`, { status: 200 });
    const response = await worker.fetch(new Request(
      'https://romonitor-api.example/api/news/v1/list-feed-digest?variant=romania&lang=ro',
    ));
    assert.equal(response.status, 200);
    const body = await response.json();
    const itemCount = Object.values(body.categories)
      .reduce((total, category) => total + category.items.length, 0);
    assert.equal(itemCount, 3);
    assert.equal(body.feedStatuses.Digi24, 'ok');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('aircraft tracking returns normalized positions from OpenSky', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({
      states: [['abc123', ' ROU01 ', null, null, 1700000000, 25, 46, 1000, false, 100, 90, 0]],
    }), { status: 200 });
    const response = await worker.fetch(new Request(
      'https://romonitor-api.example/api/aviation/v1/track-aircraft',
    ));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.source, 'opensky');
    assert.equal(body.positions[0].callsign, 'ROU01');
    assert.equal(body.positions[0].lat, 46);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
