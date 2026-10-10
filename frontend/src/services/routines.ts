import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db, ensureUser } from "./firebase";
import type { AnalysisResult, Product, Routine } from "@shared/types";
import { buildApiUrl, resolveApiBaseUrl } from "./api";

const col = async () => collection(db, "users", await ensureUser(), "routines");

export async function listRoutines(): Promise<Routine[]> {
  const snap = await getDocs(await col());
  return snap.docs.map((d) => d.data() as Routine);
}

export async function saveRoutine(routine: Routine): Promise<void> {
  await setDoc(doc(await col(), routine.id), routine);
}

export async function removeRoutine(id: string): Promise<void> {
  await deleteDoc(doc(await col(), id));
}

export async function analyse(products: Product[]): Promise<AnalysisResult> {
  return postAnalysis({ products });
}

export async function analyseIngredients(ingredients: string[]): Promise<AnalysisResult> {
  return postAnalysis({ ingredients });
}

async function postAnalysis(body: { products?: Product[]; ingredients?: string[] }): Promise<AnalysisResult> {
  const apiUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL, import.meta.env.DEV);
  const res = await fetch(buildApiUrl(apiUrl, "/api/analyse"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Analysis failed. Check the API server and try again.");
  }
  return res.json();
}
