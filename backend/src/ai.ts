
import { GoogleGenAI } from "@google/genai";
import type { Finding, IngredientAssessment, Product } from "../../shared/types.js";
import { validateProductExtraction, type ProductExtraction } from "../../shared/extraction.js";

export function isGeminiApiKeyConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Image extraction requires GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey });
}

export async function extractProductFromImage(image: Buffer, mimeType: string): Promise<ProductExtraction> {
  const ai = createGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: `Read the visible text on this skincare or beauty product photo. Return only JSON with keys name, brand, category, ingredients, instructions, rawText, ingredientListStatus, uncertaintyNotes.
category must be one of cleanser, toner, serum, moisturiser, sunscreen, treatment.
ingredients must be an array of objects {"name": string, "certainty": "clear"|"uncertain"}. Preserve each readable ingredient's exact visible spelling, INCI form, punctuation, and word order. Include small print and join lines/sections in their printed order. Do not duplicate an ingredient repeated because sections overlap. Do not guess unreadable characters or infer a formula from the product name. Mark a partly readable ingredient uncertain only when some text is visible; omit wholly unreadable ingredients and explain their location in uncertaintyNotes.
rawText must transcribe visible label text as closely as possible, with line breaks where useful; do not complete obscured text. ingredientListStatus is complete only when the ingredient list itself is visibly readable from first through last item with no cropped/obscured parts, partial when a list is visible but incomplete/uncertain, and unknown when no ingredient list can be seen. A front-of-pack-only image should normally have unknown status and an empty ingredients array.
Use empty strings for unreadable name, brand, instructions, or rawText. uncertaintyNotes must be an array of concise notes. If nothing is uncertain, use an empty array.` },
      { inlineData: { mimeType, data: image.toString("base64") } },
    ],
    config: { responseMimeType: "application/json" },
  });
  const raw = response.text?.trim();
  if (!raw) throw new Error("No product information was readable in the image");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Gemini returned malformed extraction JSON");
  }
  return validateProductExtraction(parsed);
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

  if (!isGeminiApiKeyConfigured()) {
    return { summary: fallback, generated: false };
  }

  try {
    const ai = createGeminiClient();

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
