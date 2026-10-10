import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db, ensureUser } from "./firebase";
import type { Product } from "@shared/types";

const col = async () => collection(db, "users", await ensureUser(), "products");

export async function listProducts(): Promise<Product[]> {
  const snap = await getDocs(await col());
  return snap.docs.map((d) => d.data() as Product);
}

export async function saveProduct(product: Product): Promise<void> {
  await setDoc(doc(await col(), product.id), product);
}

export async function removeProduct(id: string): Promise<void> {
  await deleteDoc(doc(await col(), id));
}
