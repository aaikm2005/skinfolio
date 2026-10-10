import assert from "node:assert/strict";
import test from "node:test";
import { mergeProductExtractions, validateProductExtraction } from "../../shared/extraction.js";
import { validateImageRequest } from "./extraction-request.js";

const extraction = (overrides: Record<string, unknown> = {}) => validateProductExtraction({
  name: "Barrier Cream",
  brand: "Example",
  category: "moisturiser",
  ingredients: [
    { name: "Aqua", certainty: "clear" },
    { name: "Caprylic/Capric Triglyceride", certainty: "clear" },
  ],
  instructions: "",
  rawText: "INGREDIENTS: Aqua, Caprylic/Capric Triglyceride",
  ingredientListStatus: "complete",
  uncertaintyNotes: [],
  ...overrides,
});

test("extraction validator retains ingredient spellings and normalizes repeated entries", () => {
  const result = extraction({
    ingredients: [
      { name: "Aqua", certainty: "uncertain" },
      { name: " aqua ", certainty: "clear" },
      { name: "Caprylic/Capric Triglyceride", certainty: "clear" },
    ],
  });
  assert.deepEqual(result.ingredients, [
    { name: "Aqua", certainty: "clear" },
    { name: "Caprylic/Capric Triglyceride", certainty: "clear" },
  ]);
});

test("validator rejects malformed AI objects and malformed ingredient entries", () => {
  assert.throws(() => validateProductExtraction(null), /malformed extraction/i);
  assert.throws(() => extraction({ ingredients: ["Aqua"] }), /malformed ingredient/i);
  assert.throws(() => extraction({ category: "cream" }), /invalid product category/i);
});

test("missing and incomplete ingredient lists remain unknown or partial", () => {
  const unknown = extraction({ ingredients: [], ingredientListStatus: "complete" });
  assert.equal(unknown.ingredientListStatus, "unknown");

  const partial = extraction({ ingredientListStatus: "partial", uncertaintyNotes: ["Bottom line is cut off."] });
  assert.equal(partial.ingredientListStatus, "partial");
  assert.deepEqual(partial.uncertaintyNotes, ["Bottom line is cut off."]);
});

test("multi-photo merge removes duplicate ingredients and retains partial status and raw text", () => {
  const first = extraction({
    ingredients: [{ name: "Aqua", certainty: "clear" }],
    rawText: "Front label",
    ingredientListStatus: "unknown",
  });
  const second = extraction({
    ingredients: [
      { name: "Aqua", certainty: "clear" },
      { name: "Niacinamide", certainty: "uncertain" },
    ],
    rawText: "INGREDIENTS: Aqua, Niacinamide?",
    ingredientListStatus: "partial",
    uncertaintyNotes: ["Niacinamide spelling is unclear."],
  });
  const merged = mergeProductExtractions([first, second]);
  assert.deepEqual(merged.ingredients.map(item => item.name), ["Aqua", "Niacinamide"]);
  assert.equal(merged.ingredientListStatus, "partial");
  assert.match(merged.rawText, /Front label/);
  assert.match(merged.rawText, /INGREDIENTS/);
});

test("image request validation rejects empty, unsupported, and mismatched image uploads", () => {
  assert.equal(validateImageRequest("image/jpeg", Buffer.alloc(0)).status, 400);
  assert.equal(validateImageRequest("image/heic", Buffer.from("image")).status, 415);
  assert.equal(validateImageRequest("image/png", Buffer.from("not a png")).status, 400);
  assert.equal(validateImageRequest("image/jpeg", Buffer.from([0xff, 0xd8, 0xff])).ok, true);
});
