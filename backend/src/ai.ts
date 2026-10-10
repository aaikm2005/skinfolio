
import { GoogleGenAI } from "@google/genai";
import type { Finding, IngredientAssessment, Product } from "../../shared/types.js";

export interface ExtractedProduct {
  name: string;
  brand: string;
  category: Product["category"];
  ingredients: string[];
  instructions: string;
}

export async function extractProductFromImage(image: Buffer, mimeType: string): Promise<ExtractedProduct> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Image extraction requires GEMINI_API_KEY");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: `Read this skincare product packaging. Return only a JSON object with keys name, brand, category, ingredients, instructions. category must be one of cleanser, toner, serum, moisturiser, sunscreen, treatment. ingredients must be an array of individual INCI ingredients read from the image; use an empty array if unreadable. Use empty strings for unreadable name, brand, or instructions. Do not guess or invent label text.` },
      { inlineData: { mimeType, data: image.toString("base64") } },
    ],
    config: { responseMimeType: "application/json" },
  });
  const raw = response.text?.trim();
  if (!raw) throw new Error("No product information was readable in the image");
  const parsed = JSON.parse(raw) as Partial<ExtractedProduct>;
  const categories: Product["category"][] = ["cleanser", "toner", "serum", "moisturiser", "sunscreen", "treatment"];
  return {
    name: typeof parsed.name === "string" ? parsed.name : "",
    brand: typeof parsed.brand === "string" ? parsed.brand : "",
    category: categories.includes(parsed.category as Product["category"]) ? parsed.category as Product["category"] : "treatment",
    ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients.filter((item): item is string => typeof item === "string") : [],
    instructions: typeof parsed.instructions === "string" ? parsed.instructions : "",
  };
}

const MODEL = "gemini-3.8-flash";

export async function explainFindings(
  products: Product[],
  findings: Finding[],
  ingredientAssessments: IngredientAssessment[] = []
): Promise<{ summary: string; generated: boolean }> {
  const fallback = products.length === 0 && ingredientAssessments.length > 0
    ? `Matched ${ingredientAssessments.filter((item) => item.known).length} known ingredient(s); ${ingredientAssessments.filter((item) => !item.known).length} ingredient(s) are unknown to the starter knowledge base and were not evaluated.`
    : products.length > 0 && products.every((product) => product.ingredients.length === 0)
    ? "No ingredient lists are recorded for these products, so the current checker could not evaluate them."
    : products.length === 1 && findings.length === 0
      ? "This product was checked against the app's limited ingredient rules. The checker cannot assess product efficacy or personal suitability, and interaction rules compare ingredients across products."
      : findings.length > 0
      ? "Potential ingredient interactions were flagged by our rule-based checker. Review the findings and product instructions before using these products together."
      : "No interactions covered by our current rules were detected. This does not guarantee that every product combination is compatible.";

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { summary: fallback, generated: false };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const productDetails = products.map((product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      ingredients: product.ingredients,
      instructions: product.instructions,
    }));

    const prompt = `
You are Skinfolio, a cautious skincare information assistant.

Explain the supplied rule-based skincare findings in clear,
friendly language for a general audience.

PRODUCTS:
${JSON.stringify(productDetails, null, 2)}

RULE-BASED FINDINGS:
${JSON.stringify(findings, null, 2)}

CURATED INGREDIENT MATCHES (functions, cautions, unknown status, and references supplied by Skinfolio):
${JSON.stringify(ingredientAssessments, null, 2)}

Instructions:
- Explain only the findings provided.
- Explain only supplied curated ingredient matches and findings.
- Do not invent ingredient functions, interactions, evidence, or citations.
- Unknown ingredients must remain unknown; do not infer safety or function.
- Do not change the finding priorities or claim that a product is unsafe
  without sufficient evidence.
- Distinguish possible irritation from a proven incompatibility.
- If there are no findings, explain that the current rules detected no
  covered interactions; this does not guarantee compatibility.
- If only one product is supplied, explain that interaction rules compare
  products and cannot assess the product's efficacy or personal suitability.
- If ingredients are missing, state clearly that the product could not be
  screened; never imply that missing data is a clean result.
- Encourage users to follow verified product instructions and introduce
  potentially irritating products cautiously.
- Do not diagnose skin conditions or replace professional medical advice.
- Return a concise summary in plain text, around 2–4 sentences.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    const summary = response.text?.trim();
    return { summary: summary || fallback, generated: Boolean(summary) };
  } catch (error) {
    console.error("Gemini analysis failed:", error instanceof Error ? error.message : "Unknown provider error");
    return { summary: fallback, generated: false };
  }
}
