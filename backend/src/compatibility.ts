import type { AnalysisResult, Finding, IngredientAssessment, Product } from "../../shared/types.js";
import { INGREDIENT_KNOWLEDGE, INTERACTION_RULES } from "../../shared/knowledge.js";

const normalize = (value: string) => value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

function lookupIngredient(inputName: string) {
  const normalized = normalize(inputName);
  return INGREDIENT_KNOWLEDGE.find((item) =>
    [item.name, ...item.aliases].some((candidate) => normalize(candidate) === normalized)
  );
}

function mapIngredients(ingredients: string[], productId?: string): IngredientAssessment[] {
  const unique = new Map<string, string>();
  for (const ingredient of ingredients) {
    const cleaned = ingredient.trim();
    if (cleaned) unique.set(normalize(cleaned), cleaned);
  }
  return [...unique.values()].map((inputName) => {
    const entry = lookupIngredient(inputName);
    return entry
      ? { productId, inputName, known: true, canonicalName: entry.name, function: entry.function, cautions: entry.cautions, references: entry.references }
      : { productId, inputName, known: false, cautions: ["Not in the current starter knowledge base; no safety conclusion was made."], references: [] };
  });
}

function getCanonicalIngredients(product: Product): Set<string> {
  return new Set(product.ingredients.map(lookupIngredient).filter((item) => item !== undefined).map((item) => item.name));
}

export function analyseIngredients(ingredients: string[]): AnalysisResult {
  const ingredientAssessments = mapIngredients(ingredients);
  return {
    findings: [],
    productAssessments: [],
    ingredientAssessments,
    unevaluatedProductIds: [],
    warnings: ingredientAssessments.some((item) => !item.known)
      ? ["Some supplied ingredients are not in the starter knowledge base and were not evaluated."]
      : [],
  };
}

export function analyseRoutine(products: Product[]): AnalysisResult {
  const findings: Finding[] = [];
  const ingredientAssessments = products.flatMap((product) => mapIngredients(product.ingredients, product.id));
  const unevaluatedProductIds = products.filter((product) => product.ingredients.length === 0).map((product) => product.id);
  const productAssessments = products.map((product) => {
    const matches = mapIngredients(product.ingredients, product.id);
    const listStatus = product.ingredientListStatus ?? "unknown";
    const unknownIngredients = matches.filter((item) => !item.known).map((item) => item.inputName);
    const recognizedIngredients = matches.filter((item) => item.known).map((item) => item.canonicalName!);
    const message = product.ingredients.length === 0
      ? "No ingredient list is recorded, so this product could not be screened."
      : listStatus !== "complete"
        ? "The ingredient list is marked incomplete or unverified; matches are partial and may miss other ingredients."
        : recognizedIngredients.length === 0
          ? "No ingredients matched this starter knowledge base. This is not a safety finding."
          : "Known ingredients were matched against the starter rules; unknown ingredients are not considered safe by default.";
    return {
      productId: product.id,
      hasIngredients: product.ingredients.length > 0,
      recognizedIngredients,
      message,
      ingredientListStatus: listStatus,
      unknownIngredients,
      references: matches.flatMap((item) => item.references),
    };
  });

  for (const rule of INTERACTION_RULES) {
    const expected = new Set(rule.relevantIngredients.map(normalize));
    for (let left = 0; left < products.length; left += 1) {
      const a = products[left];
      if (!a.ingredients.length) continue;
      const aHasRelevant = [...getCanonicalIngredients(a)].some((name) => expected.has(normalize(name)));
      if (!aHasRelevant) continue;
      for (let right = left + 1; right < products.length; right += 1) {
        const b = products[right];
        if (!b.ingredients.length) continue;
        const aIngredients = getCanonicalIngredients(a);
        const bIngredients = getCanonicalIngredients(b);
        const matched = rule.relevantIngredients.filter((ingredient) =>
          [...aIngredients, ...bIngredients].some((name) => normalize(name) === normalize(ingredient))
        );
        const splitAcrossProducts = matched.some((ingredient) => [...aIngredients].some((name) => normalize(name) === normalize(ingredient)))
          && matched.some((ingredient) => [...bIngredients].some((name) => normalize(name) === normalize(ingredient)));
        if (!splitAcrossProducts) continue;
        findings.push({
          id: `${rule.id}:${a.id}:${b.id}`,
          category: "caution",
          priority: "medium",
          productIds: [a.id, b.id],
          explanation: `${rule.potentialConcern}. ${rule.explanation}`,
          evidence: rule.references.map((reference) => reference.title).join("; "),
          nextStep: "Consider separating use or following the product labels; ask a dermatologist if irritation occurs or you have a skin condition.",
          references: rule.references,
        });
      }
    }
  }

  const warnings: string[] = [];
  if (unevaluatedProductIds.length) warnings.push("Products without ingredient lists could not be screened.");
  if (productAssessments.some((assessment) => assessment.hasIngredients && assessment.ingredientListStatus !== "complete")) {
    warnings.push("One or more ingredient lists are incomplete or unverified; a missing match is not evidence of safety.");
  }
  if (ingredientAssessments.some((assessment) => !assessment.known)) {
    warnings.push("Some ingredients are not in the starter knowledge base and were not assessed.");
  }

  return { findings, productAssessments, ingredientAssessments, unevaluatedProductIds, warnings };
}
