import "dotenv/config";
import express from "express";
import cors from "cors";
import { analyseRoutine } from "./compatibility.js";
import { explainFindings, extractProductFromImage } from "./ai.js";
import type { Product } from "../../shared/types.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

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

// POST /api/analyse  { products: Product[] }
app.post("/api/analyse", async (req, res) => {
  try {
    const products = req.body?.products as Product[] | undefined;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "products[] is required" });
    }
    const result = analyseRoutine(products);
    const explanation = await explainFindings(products, result.findings);
    result.aiSummary = explanation.summary;
    result.aiGenerated = explanation.generated;
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed. Please retry." }); // FR08
  }
});

const port = Number(process.env.PORT ?? 8787);

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on port ${port}`);
});
