import assert from "node:assert/strict";
import test from "node:test";
import { GoogleGenAI } from "@google/genai";
import { createGeminiClient, isGeminiApiKeyConfigured } from "./ai.js";

const withApiKey = async (value: string | undefined, run: () => void) => {
  const original = process.env.GEMINI_API_KEY;
  if (value === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = value;
  try { run(); }
  finally {
    if (original === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = original;
  }
};

test("missing Gemini key is detected per call and client creation is rejected", async () => {
  await withApiKey(undefined, () => {
    assert.equal(isGeminiApiKeyConfigured(), false);
    assert.throws(() => createGeminiClient(), /requires GEMINI_API_KEY/);
  });
});

test("Gemini client initializes from the current environment value", async () => {
  await withApiKey("test-only-fake-gemini-key", () => {
    assert.equal(isGeminiApiKeyConfigured(), true);
    const client = createGeminiClient();
    assert.ok(client instanceof GoogleGenAI);
    assert.equal(typeof client.models.generateContent, "function");
  });
});
