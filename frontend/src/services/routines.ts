import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db, ensureUser } from "./firebase";
import type { AnalysisResult, Product, Routine } from "@shared/types";

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
  const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  if (!apiUrl) throw new Error("Set VITE_API_URL to connect to the Skinfolio API.");
  const res = await fetch(`${apiUrl}/api/analyse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Analysis failed. Check the API server and try again.");
  }
  return res.json();
}
