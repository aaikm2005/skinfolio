export type ProductCategory =
  | "cleanser"
  | "toner"
  | "serum"
  | "moisturiser"
  | "sunscreen"
  | "treatment";

export type ProductStatus = "using" | "planning" | "stopped";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  ingredients: string[]; // one entry per ingredient so the checker can inspect each
  instructions: string; // verified/label instructions only, NOT AI text
  imageUrl?: string;
  status: ProductStatus;
  createdAt: string;
}

export interface Routine {
  id: string;
  name: string;
  period: "AM" | "PM";
  productIds: string[]; // references to Product.id, no duplicated data
  createdAt: string;
  updatedAt: string;
}

export interface SkinProfile {
  skinType: "dry" | "oily" | "combination" | "normal" | "sensitive";
  concerns: string[];
  preferences: string[];
}

// ---- Compatibility analysis ----
export type FindingCategory = "conflict" | "caution" | "uncertain" | "ok";
export type FindingPriority = "high" | "medium" | "low";

export interface Finding {
  id: string;
  category: FindingCategory;
  priority: FindingPriority;
  productIds: string[];
  explanation: string; // rule-based reasoning
  evidence: string; // supporting source (FR05)
  nextStep: string; // recommendation matched to this finding (FR06)
}

export interface AnalysisResult {
  findings: Finding[];
  // Products with missing/unverified data are listed, never treated as safe (FR07)
  unevaluatedProductIds: string[];
  aiSummary?: string; // AI-generated, kept separate from rule findings
}
