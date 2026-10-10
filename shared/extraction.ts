import type { ProductCategory } from "./types.js";

export type ExtractionCertainty = "clear" | "uncertain";
export type ExtractedListStatus = "complete" | "partial" | "unknown";

export interface ExtractedIngredient {
  name: string;
  certainty: ExtractionCertainty;
}

export interface ProductExtraction {
  name: string;
  brand: string;
  category: ProductCategory;
  ingredients: ExtractedIngredient[];
  instructions: string;
  rawText: string;
  ingredientListStatus: ExtractedListStatus;
  uncertaintyNotes: string[];
}

const categories: ProductCategory[] = ["cleanser", "toner", "serum", "moisturiser", "sunscreen", "treatment"];
const certaintyValues: ExtractionCertainty[] = ["clear", "uncertain"];
const listStatuses: ExtractedListStatus[] = ["complete", "partial", "unknown"];

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Gemini returned an invalid ${field}`);
  return value.trim();
}

function normalizeIngredientName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function validateProductExtraction(value: unknown): ProductExtraction {
  const input = record(value);
  if (!input) throw new Error("Gemini returned malformed extraction data");
  if (!categories.includes(input.category as ProductCategory)) throw new Error("Gemini returned an invalid product category");
  if (!listStatuses.includes(input.ingredientListStatus as ExtractedListStatus)) throw new Error("Gemini returned an invalid ingredient list status");
  if (!Array.isArray(input.ingredients) || !Array.isArray(input.uncertaintyNotes)) {
    throw new Error("Gemini returned an invalid ingredient list");
  }

  const ingredients: ExtractedIngredient[] = [];
  const byName = new Map<string, number>();
  for (const item of input.ingredients) {
    const candidate = record(item);
    if (!candidate || typeof candidate.name !== "string" || !certaintyValues.includes(candidate.certainty as ExtractionCertainty)) {
      throw new Error("Gemini returned a malformed ingredient entry");
    }
    const name = normalizeIngredientName(candidate.name);
    if (!name) continue;
    const key = name.toLocaleLowerCase();
    const priorIndex = byName.get(key);
    if (priorIndex === undefined) {
      byName.set(key, ingredients.length);
      ingredients.push({ name, certainty: candidate.certainty as ExtractionCertainty });
    } else if (candidate.certainty === "clear") {
      ingredients[priorIndex] = { ...ingredients[priorIndex], certainty: "clear" };
    }
  }

  const uncertaintyNotes = input.uncertaintyNotes
    .map((note) => requiredString(note, "uncertainty note"))
    .filter(Boolean);
  const ingredientListStatus = ingredients.length === 0
    ? "unknown"
    : input.ingredientListStatus === "complete" && !ingredients.some((item) => item.certainty === "uncertain") && uncertaintyNotes.length === 0
      ? "complete"
      : "partial";

  return {
    name: requiredString(input.name, "product name"),
    brand: requiredString(input.brand, "brand"),
    category: input.category as ProductCategory,
    ingredients,
    instructions: requiredString(input.instructions, "instructions"),
    rawText: requiredString(input.rawText, "raw extracted text"),
    ingredientListStatus,
    uncertaintyNotes,
  };
}

export function mergeProductExtractions(results: ProductExtraction[]): ProductExtraction {
  const merged = validateProductExtraction({
    name: results.find((result) => result.name)?.name ?? "",
    brand: results.find((result) => result.brand)?.brand ?? "",
    category: results.find((result) => result.category)?.category ?? "treatment",
    ingredients: results.flatMap((result) => result.ingredients),
    instructions: results.find((result) => result.instructions)?.instructions ?? "",
    rawText: [...new Set(results.map((result) => result.rawText.trim()).filter(Boolean))].join("\n\n"),
    ingredientListStatus: results.some((result) => result.ingredientListStatus === "partial")
      ? "partial"
      : results.some((result) => result.ingredientListStatus === "complete") ? "complete" : "unknown",
    uncertaintyNotes: [...new Set(results.flatMap((result) => result.uncertaintyNotes))],
  });
  return merged;
}
