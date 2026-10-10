import assert from "node:assert/strict";
import test from "node:test";
import { parseGeminiProductResponse } from "./ai.js";

const validResponse = {
  name: "Barrier Cream",
  brand: "Example",
  category: "moisturiser",
  ingredients: [{ name: "Aqua", certainty: "clear" }],
  instructions: "Apply as directed",
  rawText: "Barrier Cream; Aqua",
  ingredientListStatus: "complete",
  uncertaintyNotes: [],
};

test("parses a valid Gemini JSON response", () => {
  assert.equal(parseGeminiProductResponse(JSON.stringify(validResponse)).ingredients[0].name, "Aqua");
});

test("categorizes empty, malformed JSON, and invalid model responses", () => {
  assert.throws(() => parseGeminiProductResponse(undefined), (error: unknown) =>
    !!error && typeof error === "object" && "category" in error && error.category === "empty_response");
  assert.throws(() => parseGeminiProductResponse("{"), (error: unknown) =>
    !!error && typeof error === "object" && "category" in error && error.category === "invalid_json");
  assert.throws(() => parseGeminiProductResponse(JSON.stringify({ ...validResponse, category: "unknown" })), (error: unknown) =>
    !!error && typeof error === "object" && "category" in error && error.category === "invalid_model_response");
});
