import "dotenv/config";
import express from "express";
import cors from "cors";
import { analyseIngredients, analyseRoutine } from "./compatibility.js";
import { explainFindings, extractProductFromImage } from "./ai.js";
import type { Product, ProductCategory, ProductStatus } from "../../shared/types.js";
import { INGREDIENT_KNOWLEDGE, INTERACTION_RULES, PRODUCT_CATALOGUE } from "../../shared/knowledge.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/knowledge", (_req, res) => res.json({ products: PRODUCT_CATALOGUE, ingredients: INGREDIENT_KNOWLEDGE, interactionRules: INTERACTION_RULES }));

const categories: ProductCategory[] = ["cleanser", "toner", "serum", "moisturiser", "sunscreen", "treatment"];
const statuses: ProductStatus[] = ["using", "planning", "stopped"];
const normalizeProducts = (input: unknown): Product[] | null => {
  const entries = Array.isArray(input) ? input : input && typeof input === "object" ? [input] : [];
  if (!entries.length) return null;
  const normalized: Product[] = [];
  for (const [index, entry] of entries.entries()) {
    if (!entry || typeof entry !== "object") return null;
    const raw = entry as Record<string, unknown>;
    if (typeof raw.name !== "string" || (raw.ingredients !== undefined && (!Array.isArray(raw.ingredients) || !raw.ingredients.every((item) => typeof item === "string")))) return null;
    const ingredients = Array.isArray(raw.ingredients) ? raw.ingredients as string[] : [];
    normalized.push({
      id: typeof raw.id === "string" ? raw.id : `submitted-product-${index + 1}`,
      name: raw.name,
      brand: typeof raw.brand === "string" ? raw.brand : "",
      category: categories.includes(raw.category as ProductCategory) ? raw.category as ProductCategory : "treatment",
      ingredients,
      ingredientListStatus: raw.ingredientListStatus === "complete" || raw.ingredientListStatus === "partial" || raw.ingredientListStatus === "unknown"
        ? raw.ingredientListStatus : "unknown",
      instructions: typeof raw.instructions === "string" ? raw.instructions : "",
      status: statuses.includes(raw.status as ProductStatus) ? raw.status as ProductStatus : "planning",
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    });
  }
  return normalized;
};

// POST /api/extract with the image bytes as the request body.
app.post("/api/extract", express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "8mb" }), async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: "Send a JPEG, PNG, or WebP image" });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "Image extraction is unavailable until GEMINI_API_KEY is configured" });
  }
  try {
    const product = await extractProductFromImage(req.body, req.headers["content-type"] ?? "image/jpeg");
    if (!product.name && product.ingredients.length === 0) {
      return res.status(422).json({ error: "Could not read product details. Try a clearer photo of the front or ingredient label." });
    }
    return res.json(product);
  } catch (error) {
    console.error("Product extraction failed:", error);
    return res.status(502).json({ error: "Could not extract product details. Please retry with a clearer photo." });
  }
});

// POST /api/analyse  { products: Product[] } | { product: Product } | { ingredients: string[] }
app.post("/api/analyse", async (req, res) => {
  try {
    const body = req.body;
    const products = normalizeProducts(body?.products ?? body?.product);
    const ingredients = Array.isArray(body?.ingredients) && body.ingredients.every((item: unknown) => typeof item === "string")
      ? body.ingredients as string[]
      : undefined;

    if (products) {
      const result = analyseRoutine(products);
      const explanation = await explainFindings(products, result.findings, result.ingredientAssessments);
      result.aiSummary = explanation.summary;
      result.aiGenerated = explanation.generated;
      return res.json(result);
    }
    if (ingredients?.length) {
      const result = analyseIngredients(ingredients);
      const explanation = await explainFindings([], result.findings, result.ingredientAssessments);
      result.aiSummary = explanation.summary;
      result.aiGenerated = explanation.generated;
      return res.json(result);
    }
    return res.status(400).json({ error: "Provide a product/products array or a non-empty ingredients[] list." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed. Please retry." }); // FR08
  }
});

const port = Number(process.env.PORT ?? 8787);

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on port ${port}`);
});
