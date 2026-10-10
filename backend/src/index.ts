import "dotenv/config";
import express from "express";
import cors from "cors";
import { analyseRoutine } from "./compatibility.js";
import { explainFindings } from "./ai.js";
import type { Product } from "../../shared/types.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// POST /api/analyse  { products: Product[] }
app.post("/api/analyse", async (req, res) => {
  try {
    const products = req.body?.products as Product[] | undefined;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "products[] is required" });
    }
    const result = analyseRoutine(products);
    result.aiSummary = await explainFindings(products, result.findings);
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
