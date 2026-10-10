import type { Finding, Product } from "../../shared/types.js";

/**
 * Gemini wrapper. Keep GEMINI_API_KEY server-side only.
 * TODO (team): call the Gemini API here (REST or official SDK) and return a
 * short plain-language summary of the rule-based findings.
 * Also add an OCR/vision function that turns a label image into Product fields.
 */
export async function explainFindings(
  _products: Product[],
  findings: Finding[]
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return findings.length
      ? "AI summary unavailable (no GEMINI_API_KEY set)."
      : "No rule-based conflicts found. This does not guarantee compatibility.";
  }
  // TODO: implement Gemini call
  return "AI summary not implemented yet.";
}
