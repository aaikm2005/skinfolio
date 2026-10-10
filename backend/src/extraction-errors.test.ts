import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyGeminiFailure,
  extractionFailureResponse,
  sanitizeDiagnosticMessage,
} from "./extraction-errors.js";

test("classifies Gemini quota, timeout, credential, and temporary provider failures", () => {
  const quota = classifyGeminiFailure(Object.assign(new Error("RESOURCE_EXHAUSTED: quota exceeded"), { statusCode: 429 }));
  assert.equal(quota.category, "quota");
  assert.equal(quota.providerStatus, 429);

  const timeout = classifyGeminiFailure(Object.assign(new Error("request timed out"), { statusCode: 504 }));
  assert.equal(timeout.category, "timeout");
  assert.equal(timeout.providerStatus, 504);

  const credentials = classifyGeminiFailure(Object.assign(new Error("API key not valid"), { statusCode: 403 }));
  assert.equal(credentials.category, "provider_configuration");

  const temporary = classifyGeminiFailure(Object.assign(new Error("service unavailable"), { statusCode: 503 }));
  assert.equal(temporary.category, "temporary_api_failure");
});

test("sanitizes provider diagnostics and returns a user-safe category response", () => {
  const prior = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-only-fake-key";
  try {
    const diagnostic = sanitizeDiagnosticMessage(new Error("upstream rejected key=test-only-fake-key"));
    assert.doesNotMatch(diagnostic, /test-only-fake-key/);
    assert.match(diagnostic, /redacted/);
  } finally {
    if (prior === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = prior;
  }

  const clientError = extractionFailureResponse(classifyGeminiFailure(Object.assign(new Error("quota"), { statusCode: 429 })));
  assert.equal(clientError.category, "quota");
  assert.match(clientError.error, /quota or rate limit/i);
});
