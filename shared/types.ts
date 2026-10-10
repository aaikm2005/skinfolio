export type ProductCategory =
  | "cleanser"
  | "toner"
  | "serum"
  | "moisturiser"
  | "sunscreen"
  | "treatment";

export type ProductStatus = "using" | "planning" | "stopped";
export type IngredientListStatus = "complete" | "partial" | "unknown";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  ingredients: string[]; // one entry per ingredient so the checker can inspect each
  ingredientListStatus?: IngredientListStatus;
  extractionRawText?: string;
  extractionUncertaintyNotes?: string[];
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
  skinType: "dry" | "oily" | "combination" | "normal" | "sensitive" | "unsure";
  concerns: string[];
  preferences: string[];
}

// ---- Compatibility analysis ----
export interface SourceReference {
  id: string;
  title: string;
  publisher: string;
  url: string;
}

export interface CatalogueProduct {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  ingredients: string[];
  ingredientListStatus: "manufacturer-listed";
  formulationNote: string;
  references: SourceReference[];
}

export interface IngredientKnowledge {
  id: string;
  name: string;
  aliases: string[];
  function: string;
  cautions: string[];
  references: SourceReference[];
}

export interface IngredientAssessment {
  productId?: string;
  inputName: string;
  known: boolean;
  canonicalName?: string;
  function?: string;
  cautions: string[];
  references: SourceReference[];
}

export interface InteractionRuleData {
  id: string;
  relevantIngredients: string[];
  potentialConcern: string;
  explanation: string;
  references: SourceReference[];
}

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
  references: SourceReference[];
}

export interface AnalysisResult {
  findings: Finding[];
  productAssessments: ProductAssessment[];
  ingredientAssessments: IngredientAssessment[];
  // Products with missing/unverified data are listed, never treated as safe (FR07)
  unevaluatedProductIds: string[];
  warnings: string[];
  aiSummary?: string; // AI-generated, kept separate from rule findings
  aiGenerated?: boolean;
}

export interface ProductAssessment {
  productId: string;
  hasIngredients: boolean;
  recognizedIngredients: string[];
  message: string;
  ingredientListStatus: IngredientListStatus;
  unknownIngredients: string[];
  references: SourceReference[];
}
