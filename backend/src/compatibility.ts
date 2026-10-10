import type { AnalysisResult, Finding, Product } from "../../shared/types.js";

/**
 * Rule-based checker. Rules are deterministic and documented; AI is NOT used
 * to decide conflicts (it only explains them, see ai.ts).
 *
 * TODO (team): verify each rule and replace `evidence` with a real citation
 * (dermatology source, ingredient safety review, etc.) before the demo.
 */
interface Rule {
  id: string;
  groupA: string[]; // lowercase ingredient keywords
  groupB: string[];
  category: Finding["category"];
  priority: Finding["priority"];
  explanation: string;
  evidence: string;
  nextStep: string;
}

const RULES: Rule[] = [
  {
    id: "retinoid-vs-exfoliating-acid",
    groupA: ["retinol", "retinal", "tretinoin", "adapalene"],
    groupB: ["glycolic acid", "lactic acid", "salicylic acid", "mandelic acid"],
    category: "caution",
    priority: "high",
    explanation:
      "Retinoids and exfoliating acids can both irritate skin; using them together may increase dryness or sensitivity.",
    evidence: "TODO: add verified source",
    nextStep: "Consider using them on alternate nights, or in AM vs PM routines.",
  },
  {
    id: "benzoyl-peroxide-vs-retinoid",
    groupA: ["benzoyl peroxide"],
    groupB: ["retinol", "retinal", "tretinoin"],
    category: "caution",
    priority: "medium",
    explanation:
      "Benzoyl peroxide may degrade some retinoids and both can be drying.",
    evidence: "TODO: add verified source",
    nextStep: "Check the product instructions and separate their use.",
  },
];

const has = (product: Product, keywords: string[]) =>
  product.ingredients.some((i) =>
    keywords.some((k) => i.toLowerCase().includes(k))
  );

const SCREENING_INGREDIENTS = [
  "retinol", "retinal", "tretinoin", "adapalene", "glycolic acid",
  "lactic acid", "salicylic acid", "mandelic acid", "benzoyl peroxide",
];

export function analyseRoutine(products: Product[]): AnalysisResult {
  const findings: Finding[] = [];
  // FR07: missing data is flagged, never treated as safe
  const unevaluated = products
    .filter((p) => p.ingredients.length === 0)
    .map((p) => p.id);
  const productAssessments = products.map((product) => {
    const recognizedIngredients = product.ingredients.filter((ingredient) =>
      SCREENING_INGREDIENTS.some((keyword) => ingredient.toLowerCase().includes(keyword))
    );
    return {
      productId: product.id,
      hasIngredients: product.ingredients.length > 0,
      recognizedIngredients,
      message: product.ingredients.length === 0
        ? "No ingredient list is recorded, so this product could not be screened."
        : recognizedIngredients.length > 0
          ? "Some ingredients match the current screening rules. This is not a full safety assessment."
          : "No ingredients matched the current screening rules. This does not mean the product is risk-free.",
    };
  });
  const evaluable = products.filter((p) => p.ingredients.length > 0);

  for (const rule of RULES) {
    for (const a of evaluable) {
      for (const b of evaluable) {
        if (a.id === b.id) continue;
        if (has(a, rule.groupA) && has(b, rule.groupB)) {
          findings.push({
            id: `${rule.id}:${a.id}:${b.id}`,
            category: rule.category,
            priority: rule.priority,
            productIds: [a.id, b.id],
            explanation: rule.explanation,
            evidence: rule.evidence,
            nextStep: rule.nextStep,
          });
        }
      }
    }
  }

  const order = { high: 0, medium: 1, low: 2 } as const;
  findings.sort((x, y) => order[x.priority] - order[y.priority]);
  return { findings, productAssessments, unevaluatedProductIds: unevaluated };
}
