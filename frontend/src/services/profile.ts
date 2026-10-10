import { doc, getDoc, setDoc } from "firebase/firestore";
import type { SkinProfile } from "@shared/types";
import { db, ensureUser } from "./firebase";

const profileDoc = async () => doc(db, "users", await ensureUser(), "profile", "current");

export async function getProfile(): Promise<SkinProfile | null> {
  const snapshot = await getDoc(await profileDoc());
  return snapshot.exists() ? snapshot.data() as SkinProfile : null;
}

export async function saveProfile(profile: SkinProfile): Promise<void> {
  await setDoc(await profileDoc(), profile);
}
