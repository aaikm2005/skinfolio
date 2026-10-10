import "dotenv/config";
import express from "express";
import cors from "cors";
import { analyseIngredients, analyseRoutine } from "./compatibility.js";
import { explainFindings, extractProductFromImage, isGeminiApiKeyConfigured } from "./ai.js";
import { validateImageRequest } from "./extraction-request.js";
import { classifyGeminiFailure, extractionFailureResponse, sanitizeDiagnosticMessage } from "./extraction-errors.js";
import { createCorsOptions, getAllowedOrigins, isAllowedOrigin } from "./cors-config.js";
import type { Product, ProductCategory, ProductStatus } from "../../shared/types.js";
import { INGREDIENT_KNOWLEDGE, INTERACTION_RULES, PRODUCT_CATALOGUE } from "../../shared/knowledge.js";

const app = express();
const allowedOrigins = getAllowedOrigins(process.env.CORS_ORIGIN);
if (allowedOrigins.length === 0) console.warn("CORS_ORIGIN is missing or invalid; browser origins will not be allowed.");

// Log request metadata only: never log image bytes, request bodies, or credentials.
app.use((req, res, next) => {
  if (req.path !== "/api/extract") return next();
  const startedAt = Date.now();
  const origin = req.get("origin");
  console.info("api.extract.request", {
    method: req.method,
    origin: origin ?? null,
    originAllowed: isAllowedOrigin(origin, allowedOrigins),
    contentType: req.get("content-type") ?? null,
    contentLength: req.get("content-length") ?? null,
    geminiApiKeyConfigured: isGeminiApiKeyConfigured(),
  });
  res.on("finish", () => console.info("api.extract.response", {
    status: res.statusCode,
    durationMs: Date.now() - startedAt,
  }));
  next();
});

app.use(cors(createCorsOptions(allowedOrigins, (origin) => console.warn("cors.origin_rejected", { origin }))));
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
app.post("/api/extract", express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "4mb" }), async (req, res) => {
  const validation = validateImageRequest(req.headers["content-type"], req.body);
  if (!validation.ok) return res.status(validation.status!).json({ error: validation.error });
  if (!isGeminiApiKeyConfigured()) {
    return res.status(503).json({ error: "Image extraction is unavailable until GEMINI_API_KEY is configured" });
  }
  try {
    const product = await extractProductFromImage(req.body, validation.mimeType!);
    if (!product.name && product.ingredients.length === 0 && !product.rawText) {
      return res.status(422).json({ error: "Could not read product details. Try a clearer photo of the front or ingredient label." });
    }
    return res.json(product);
  } catch (error) {
    const failure = classifyGeminiFailure(error);
    const responseError = extractionFailureResponse(failure);
    console.error("Product extraction failed", {
      category: failure.category,
      status: 502,
      providerStatus: failure.providerStatus,
      message: sanitizeDiagnosticMessage(failure),
    });
    return res.status(502).json(responseError);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const err = error as { status?: number; type?: string; message?: string };
  if (err.status === 413 || err.type === "entity.too.large") {
    return res.status(413).json({ error: "Each image must be 4 MB or smaller." });
  }
  if (err.message === "Origin is not allowed by CORS") {
    return res.status(403).json({ error: "This website is not allowed to use the Skinfolio API. Check the backend CORS_ORIGIN setting." });
  }
  console.error("API request failed:", error);
  return res.status(400).json({ error: "The request could not be processed. Check the image and try again." });
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

// Vercel discovers this Express app from src/index.ts. Traditional local/server
// execution is provided by ../server.ts, which listens on process.env.PORT.
export default app;
