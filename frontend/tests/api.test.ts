import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExtractUrl, requestProductExtraction, resolveApiBaseUrl } from '../src/services/api.js';

test('resolves only a backend origin and normalizes one trailing slash', () => {
  assert.equal(resolveApiBaseUrl(' https://api.example.test/ ', false), 'https://api.example.test');
  assert.equal(buildExtractUrl('https://api.example.test/'), 'https://api.example.test/api/extract');
  assert.equal(resolveApiBaseUrl(undefined, true), 'http://localhost:8787');
});

test('rejects missing production configuration and paths that would duplicate /api', () => {
  assert.throws(() => resolveApiBaseUrl(undefined, false), /not configured/);
  assert.throws(() => resolveApiBaseUrl('http://localhost:8787', false), /local machine/);
  assert.throws(() => resolveApiBaseUrl('http://127.0.0.1:8787', false), /local machine/);
  assert.throws(() => resolveApiBaseUrl('http://[::1]:8787', false), /local machine/);
  assert.throws(() => resolveApiBaseUrl('https://api.example.test/api', false), /only the backend origin/);
  assert.throws(() => resolveApiBaseUrl('https://user:pass@api.example.test', false), /only the backend origin/);
});

test('keeps localhost available only in development', () => {
  assert.equal(resolveApiBaseUrl('http://localhost:8787', true), 'http://localhost:8787');
  assert.equal(resolveApiBaseUrl(undefined, true), 'http://localhost:8787');
});

test('posts raw image bytes with their image content type and parses structured success', async () => {
  let requestedUrl = '';
  let init: RequestInit | undefined;
  const file = { type: 'image/jpeg' } as File;
  const payload = { name: 'Product', ingredients: [] };
  const result = await requestProductExtraction('https://api.example.test', file, 'image/jpeg', async (input, options) => {
    requestedUrl = String(input);
    init = options;
    return Response.json(payload);
  });
  assert.equal(requestedUrl, 'https://api.example.test/api/extract');
  assert.equal(init?.method, 'POST');
  assert.equal((init?.headers as Record<string, string>)['Content-Type'], 'image/jpeg');
  assert.equal(init?.body, file);
  assert.deepEqual(result, payload);
});

test('reports HTTP, invalid JSON, and network failures distinctly', async () => {
  const file = { type: 'image/png' } as File;
  await assert.rejects(
    requestProductExtraction('https://api.example.test', file, 'image/png', async () => Response.json({ error: 'Gemini is unavailable' }, { status: 502 })),
    /Gemini is unavailable \(HTTP 502\)/,
  );
  await assert.rejects(
    requestProductExtraction('https://api.example.test', file, 'image/png', async () => new Response('upstream error', { status: 413 })),
    /non-JSON error \(HTTP 413\)/,
  );
  await assert.rejects(
    requestProductExtraction('https://api.example.test', file, 'image/png', async () => new Response('not-json')),
    /invalid JSON \(HTTP 200\)/,
  );
  await assert.rejects(
    requestProductExtraction('https://api.example.test', file, 'image/png', async () => { throw new TypeError('Failed to fetch'); }),
    /network, CORS, TLS, or backend URL failure/,
  );
});
