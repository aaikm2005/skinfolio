
import { GoogleGenAI } from "@google/genai";
import type { Finding, Product } from "../../shared/types.js";

const MODEL = "gemini-3.8-flash";

export async function explainFindings(
  products: Product[],
  findings: Finding[]
): Promise<string> {
  const fallback =
    findings.length > 0
      ? "Potential ingredient interactions were flagged by our rule-based checker. Review the findings and product instructions before using these products together."
      : "No interactions covered by our current rules were detected. This does not guarantee that every product combination is compatible.";

  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Gemini API key loaded:", Boolean(apiKey));

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing.");
    return fallback;
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

Instructions:
- Explain only the findings provided.
- Do not invent ingredient interactions, evidence, or citations.
- Do not change the finding priorities or claim that a product is unsafe
  without sufficient evidence.
- Distinguish possible irritation from a proven incompatibility.
- If there are no findings, explain that the current rules detected no
  covered interactions; this does not guarantee compatibility.
- Encourage users to follow verified product instructions and introduce
  potentially irritating products cautiously.
- Do not diagnose skin conditions or replace professional medical advice.
- Return a concise summary in plain text, around 2–4 sentences.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    console.log("Gemini response text:", response.text);

    const summary = response.text?.trim();

    return summary || fallback;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return fallback;
  }
}