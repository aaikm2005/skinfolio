import { useEffect, useState } from "react";
import { Check, Circle, CircleDot } from "lucide-react";
import type { SkinProfile as SkinProfileData } from "@shared/types";
import { getProfile, saveProfile } from "../services/profile";

const skinTypes: { id: SkinProfileData["skinType"]; label: string; desc: string }[] = [
  { id: "oily", label: "Oily", desc: "Shine across most of the face" },
  { id: "dry", label: "Dry", desc: "Often feels tight or flaky" },
  { id: "combination", label: "Combination", desc: "Oily T-zone, drier elsewhere" },
  { id: "normal", label: "Normal", desc: "Rarely oily or tight" },
  { id: "sensitive", label: "Sensitive", desc: "Often reacts to products or weather" },
];
const concernsList = ["Breakouts", "Dehydration", "Redness", "Sensitivity", "Dark spots"];
const defaults: SkinProfileData = { skinType: "combination", concerns: [], preferences: [] };

export default function SkinProfile() {
  const [profile, setProfile] = useState<SkinProfileData>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getProfile().then(saved => { if (saved) setProfile(saved); }).catch(() => setMessage("Could not load your saved profile.")).finally(() => setLoading(false));
  }, []);

  const toggleConcern = (concern: string) => setProfile(current => ({
    ...current,
    concerns: current.concerns.includes(concern) ? current.concerns.filter(item => item !== concern) : [...current.concerns, concern],
  }));

  const update = async () => {
    setSaving(true); setMessage("");
    try { await saveProfile(profile); setMessage("Profile updated."); }
    catch { setMessage("Could not save your profile. Check your connection and try again."); }
    finally { setSaving(false); }
  };

  return <div className="-mx-4 -mt-4 relative min-h-screen bg-[#F8F5F1] font-sans text-gray-800">
    <div className="px-6 pb-32 pt-10">
      <h1 className="mb-3 font-serif text-4xl font-bold text-[#3A2D2A]">Skin profile</h1>
      <p className="mb-8 text-sm leading-relaxed text-gray-600">Self-reported details that tailor each check. This isn't a medical diagnosis.</p>
      {message && <p role="status" className="mb-4 rounded-xl bg-white p-3 text-sm text-[#6B2D40]">{message}</p>}
      <h2 className="mb-4 font-serif text-2xl font-bold text-[#3A2D2A]">Skin type</h2>
      <div className="mb-3 grid grid-cols-2 gap-3">
        {skinTypes.map(type => { const selected = profile.skinType === type.id; return <button key={type.id} onClick={() => setProfile({ ...profile, skinType: type.id })} className={`rounded-xl border p-4 text-left ${selected ? "border-[#6B2D40] bg-[#F4EBEB]" : "border-gray-200 bg-white"}`}>
          <span className="mb-1.5 flex items-center gap-2">{selected ? <CircleDot size={18} className="text-[#6B2D40]" /> : <Circle size={18} className="text-[#CBAA9E]" />}<b>{type.label}</b></span><span className="block text-xs leading-relaxed text-gray-500">{type.desc}</span>
        </button>; })}
      </div>
      <button onClick={() => setProfile({ ...profile, skinType: "unsure" })} className={`mb-8 w-full rounded-xl border p-4 text-left ${profile.skinType === "unsure" ? "border-[#6B2D40] bg-[#F4EBEB]" : "border-gray-200 bg-white"}`}><span className="flex items-center gap-2">{profile.skinType === "unsure" ? <CircleDot size={18} className="text-[#6B2D40]" /> : <Circle size={18} className="text-[#CBAA9E]" />}<b>Not sure</b></span><span className="ml-[26px] block text-xs text-gray-500">Skip type-based checks</span></button>
      <h2 className="mb-2 font-serif text-2xl font-bold text-[#3A2D2A]">Skin concerns</h2><p className="mb-4 text-sm text-gray-500">Optional — choose any that apply.</p>
      <div className="flex flex-wrap gap-2.5">{concernsList.map(concern => { const selected = profile.concerns.includes(concern); return <button key={concern} onClick={() => toggleConcern(concern)} className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium ${selected ? "border-[#6B2D40] bg-[#F4EBEB] text-[#6B2D40]" : "border-gray-200 bg-white"}`}>{selected && <Check size={16} />}{concern}</button>; })}</div>
    </div>
    <div className="fixed inset-x-0 bottom-[72px] mx-auto max-w-md border-t border-gray-100/50 bg-[#F8F5F1] px-6 py-4"><button onClick={() => void update()} disabled={loading || saving} className="w-full rounded-xl bg-[#6B2D40] py-4 text-lg font-medium text-white disabled:opacity-60">{loading ? "Loading…" : saving ? "Saving…" : "Update profile"}</button></div>
  </div>;
}
