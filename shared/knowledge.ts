import type { CatalogueProduct, IngredientKnowledge, InteractionRuleData, SourceReference } from "./types.js";

export const SOURCES = {
  ordinaryRetinol: {
    id: "ordinary-retinol-02",
    title: "Retinol 0.2% in Squalane: ingredients and product information",
    publisher: "The Ordinary",
    url: "https://theordinary.com/en-gb/retinol-02-in-squalane-serum-100439.html",
  },
  ordinaryGlycolic: {
    id: "ordinary-glycolic-7",
    title: "Glycolic Acid 7% Exfoliating Toner: ingredients and product information",
    publisher: "The Ordinary",
    url: "https://theordinary.com/en-gb/glycolic-acid-7-toning-solution-exfoliator-100418.html",
  },
  aadRetinoids: {
    id: "aad-retinoid-retinol",
    title: "Retinoid or retinol?",
    publisher: "American Academy of Dermatology",
    url: "https://www.aad.org/public/everyday-care/skin-care-secrets/anti-aging/retinoid-retinol",
  },
  aadExfoliation: {
    id: "aad-exfoliation",
    title: "How to safely exfoliate at home",
    publisher: "American Academy of Dermatology",
    url: "https://www.aad.org/public/everyday-care/skin-care-secrets/routine/safely-exfoliate-at-home",
  },
  fdaAha: {
    id: "fda-aha-guidance",
    title: "Guidance for Industry: Labeling for Cosmetics Containing Alpha Hydroxy Acids",
    publisher: "U.S. Food and Drug Administration",
    url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/guidance-industry-labeling-cosmetics-containing-alpha-hydroxy-acids",
  },
} satisfies Record<string, SourceReference>;

export const PRODUCT_CATALOGUE: CatalogueProduct[] = [
  {
    id: "the-ordinary-retinol-02-squalane",
    name: "Retinol 0.2% in Squalane",
    brand: "The Ordinary",
    category: "serum",
    ingredients: [
      "Squalane", "Caprylic/Capric Triglyceride", "Simmondsia Chinensis (Jojoba) Seed Oil",
      "Retinol", "Solanum Lycopersicum (Tomato) Fruit Extract", "Rosmarinus Officinalis (Rosemary) Leaf Extract",
      "Hydroxymethoxyphenyl Decanone", "BHT",
    ],
    ingredientListStatus: "manufacturer-listed",
    formulationNote: "The manufacturer notes that formulations may change and vary by region; compare with the package in hand.",
    references: [SOURCES.ordinaryRetinol],
  },
  {
    id: "the-ordinary-glycolic-acid-7-toner",
    name: "Glycolic Acid 7% Exfoliating Toner",
    brand: "The Ordinary",
    category: "toner",
    ingredients: [
      "Aqua (Water)", "Glycolic Acid", "Rosa Damascena Flower Water", "Centaurea Cyanus Flower Water",
      "Aloe Barbadensis Leaf Water", "Propanediol", "Glycerin", "Triethanolamine", "Aminomethyl Propanol",
      "Panax Ginseng Root Extract", "Tasmannia Lanceolata Fruit/Leaf Extract", "Aspartic Acid", "Alanine",
      "Glycine", "Serine", "Valine", "Isoleucine", "Proline", "Threonine", "Histidine", "Phenylalanine",
      "Glutamic Acid", "Arginine", "PCA", "Sodium PCA", "Sodium Lactate", "Fructose", "Glucose",
      "Sucrose", "Urea", "Hexyl Nicotinate", "Dextrin", "Citric Acid", "Polysorbate 20", "Gellan Gum",
      "Trisodium Ethylenediamine Disuccinate", "Sodium Chloride", "Hexylene Glycol", "Potassium Sorbate",
      "Sodium Benzoate", "1,2-Hexanediol", "Caprylyl Glycol",
    ],
    ingredientListStatus: "manufacturer-listed",
    formulationNote: "The manufacturer notes that formulations may change and vary by region; compare with the package in hand.",
    references: [SOURCES.ordinaryGlycolic],
  },
];

export const INGREDIENT_KNOWLEDGE: IngredientKnowledge[] = [
  {
    id: "retinol",
    name: "Retinol",
    aliases: [],
    function: "A topical retinoid used in skincare for the appearance of uneven tone and texture.",
    cautions: [
      "May irritate or dry skin; sensitive skin may need extra caution.",
      "Can increase sun sensitivity; follow the product label and use sun protection.",
    ],
    references: [SOURCES.aadRetinoids, SOURCES.ordinaryRetinol],
  },
  {
    id: "glycolic-acid",
    name: "Glycolic Acid",
    aliases: ["Glycolic Acid (AHA)"],
    function: "An alpha hydroxy acid used as a chemical exfoliant; product effects depend on the formulation.",
    cautions: [
      "Topical AHA products may increase sun sensitivity and sunburn risk; follow label directions and use sun protection.",
      "Exfoliation can irritate or worsen dryness, especially when combined with other irritating products.",
    ],
    references: [SOURCES.fdaAha, SOURCES.aadExfoliation, SOURCES.ordinaryGlycolic],
  },
];

export const INTERACTION_RULES: InteractionRuleData[] = [
  {
    id: "retinol-with-glycolic-acid",
    relevantIngredients: ["Retinol", "Glycolic Acid"],
    potentialConcern: "Possible increased dryness or irritation",
    explanation: "Retinol and glycolic acid can each irritate skin. Using products containing both in the same routine may increase irritation for some people; this is a caution, not proof that the products are universally unsafe together.",
    references: [SOURCES.aadRetinoids, SOURCES.aadExfoliation],
  },
];
