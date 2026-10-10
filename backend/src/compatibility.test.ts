import assert from "node:assert/strict";
import test from "node:test";
import type { Product } from "../../shared/types.js";
import { PRODUCT_CATALOGUE } from "../../shared/knowledge.js";
import { analyseIngredients, analyseRoutine } from "./compatibility.js";

const product = (id: string, ingredients: string[], ingredientListStatus: Product["ingredientListStatus"] = "complete"): Product => ({
  id,
  name: id,
  brand: "Test brand",
  category: "treatment",
  ingredients,
  ingredientListStatus,
  instructions: "",
  status: "using",
  createdAt: "2026-01-01T00:00:00.000Z",
});

test("starter product catalogue has manufacturer references and ingredient lists", () => {
  assert.equal(PRODUCT_CATALOGUE.length, 2);
  for (const item of PRODUCT_CATALOGUE) {
    assert.ok(item.name);
    assert.ok(item.brand);
    assert.ok(item.ingredients.length > 0);
    assert.equal(item.ingredientListStatus, "manufacturer-listed");
    assert.ok(item.references.some(reference => reference.url.startsWith("https://")));
  }
});

test("ingredient endpoint canonicalizes known names and returns reference-backed details", () => {
  const result = analyseIngredients([" glycolic acid "]);
  assert.equal(result.ingredientAssessments[0].known, true);
  assert.equal(result.ingredientAssessments[0].canonicalName, "Glycolic Acid");
  assert.ok(result.ingredientAssessments[0].function);
  assert.ok(result.ingredientAssessments[0].references.length > 0);
});

test("unknown ingredients remain unknown and produce a warning", () => {
  const result = analyseIngredients(["Mystery Compound"]);
  assert.equal(result.ingredientAssessments[0].known, false);
  assert.match(result.ingredientAssessments[0].cautions.join(" "), /no safety conclusion/i);
  assert.ok(result.warnings.length > 0);
});

test("retinol and glycolic acid across products produce a sourced caution", () => {
  const result = analyseRoutine([
    product("retinol", ["Retinol"]),
    product("glycolic", ["Glycolic Acid"]),
  ]);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].category, "caution");
  assert.ok(result.findings[0].references.some(reference => reference.publisher === "American Academy of Dermatology"));
});

test("ingredients inside one formula are not treated as a cross-product interaction", () => {
  const result = analyseRoutine([product("combined-formula", ["Retinol", "Glycolic Acid"])]);
  assert.equal(result.findings.length, 0);
});

test("missing ingredient labels are unevaluated rather than cleared", () => {
  const result = analyseRoutine([product("missing-label", [], "unknown")]);
  assert.deepEqual(result.unevaluatedProductIds, ["missing-label"]);
  assert.equal(result.productAssessments[0].hasIngredients, false);
  assert.match(result.productAssessments[0].message, /could not be screened/i);
  assert.ok(result.warnings.length > 0);
});

test("partial ingredient labels can flag known matches but warn that results are incomplete", () => {
  const result = analyseRoutine([
    product("partial-retinol", ["Retinol"], "partial"),
    product("partial-glycolic", ["Glycolic Acid"], "partial"),
  ]);
  assert.equal(result.findings.length, 1);
  assert.ok(result.warnings.some(warning => /incomplete|unverified/i.test(warning)));
});
