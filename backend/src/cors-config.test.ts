import test from 'node:test';
import assert from 'node:assert/strict';
import cors from 'cors';
import { createCorsOptions, getAllowedOrigins, isAllowedOrigin, normalizeConfiguredOrigin } from './cors-config.js';

test('accepts exact HTTP origins with or without a trailing slash', () => {
  assert.equal(normalizeConfiguredOrigin(' https://skinfolio.example.test/ '), 'https://skinfolio.example.test');
  const allowed = getAllowedOrigins('https://skinfolio.example.test/, http://localhost:5173');
  assert.deepEqual(allowed, ['https://skinfolio.example.test', 'http://localhost:5173']);
  assert.equal(isAllowedOrigin('https://skinfolio.example.test', allowed), true);
  assert.equal(isAllowedOrigin(undefined, allowed), true);
});

test('does not allow a different scheme, hostname, or URL path', () => {
  const allowed = getAllowedOrigins('https://skinfolio.example.test');
  assert.equal(isAllowedOrigin('http://skinfolio.example.test', allowed), false);
  assert.equal(isAllowedOrigin('https://preview.skinfolio.example.test', allowed), false);
  assert.equal(isAllowedOrigin('https://skinfolio.example.test', allowed), true);
  assert.equal(normalizeConfiguredOrigin('https://skinfolio.example.test/app'), null);
});

test('answers an allowed POST preflight with only the requested safe headers', async () => {
  const middleware = cors(createCorsOptions(getAllowedOrigins('https://skinfolio.example.test')));
  const headers: Record<string, string> = {};
  const req = {
    method: 'OPTIONS',
    headers: {
      origin: 'https://skinfolio.example.test',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type',
    },
  };
  const res = {
    statusCode: 200,
    setHeader(name: string, value: string) { headers[name.toLowerCase()] = value; },
    getHeader(name: string) { return headers[name.toLowerCase()]; },
    end() { finish(); return this; },
  };
  let finish!: () => void;
  await new Promise<void>((resolve, reject) => {
    finish = resolve;
    try { middleware(req as never, res as never, resolve); }
    catch (error) { reject(error); }
  });
  assert.equal(res.statusCode, 204);
  assert.equal(headers['access-control-allow-origin'], 'https://skinfolio.example.test');
  assert.match(headers['access-control-allow-methods'], /POST/);
  assert.equal(headers['access-control-allow-headers'], 'Content-Type');
});
