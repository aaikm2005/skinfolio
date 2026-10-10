import { useCallback, useEffect, useMemo, useState } from "react";
import { Moon, Plus, Sun, X } from "lucide-react";
import type { AnalysisResult, Product, Routine } from "@shared/types";
import { analyse, listRoutines, saveRoutine } from "../services/routines";
import { listProducts } from "../services/products";

export default function Routines() {
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const routine = routines.find(item => item.period === period);
  const routineProducts = useMemo(() => (routine?.productIds ?? []).map(id => products.find(item => item.id === id)).filter((item): item is Product => Boolean(item)), [routine, products]);

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { const [savedRoutines, savedProducts] = await Promise.all([listRoutines(), listProducts()]); setRoutines(savedRoutines); setProducts(savedProducts); }
    catch { setError("Could not load routines and products. Check Firebase setup and retry."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const updateRoutine = async (productIds: string[]) => {
    setBusy(true); setError("");
    const now = new Date().toISOString();
    const next: Routine = routine ? { ...routine, productIds, updatedAt: now } : { id: crypto.randomUUID(), name: period === "AM" ? "Morning routine" : "Evening routine", period, productIds, createdAt: now, updatedAt: now };
    try { await saveRoutine(next); setRoutines(current => [...current.filter(item => item.id !== next.id), next]); setAdding(false); setResult(null); }
    catch { setError("Could not save your routine. Please try again."); }
    finally { setBusy(false); }
  };

  const runAnalysis = async () => {
    if (!routineProducts.length) { setError("Add products to this routine before analysing it."); return; }
    setBusy(true); setError(""); setResult(null);
    try { setResult(await analyse(routineProducts)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Analysis failed. Please retry."); }
    finally { setBusy(false); }
  };

  return <div className="-mx-4 -mt-4 min-h-screen bg-[#F8F5F1] font-sans text-gray-800">
    <header className="px-6 pb-6 pt-10"><h1 className="mb-2 font-serif text-4xl font-bold text-[#3A2D2A]">Routines</h1><p className="text-sm text-gray-500">Build a product list for morning and evening, then check for ingredient flags.</p></header>
    <div className="px-6 pb-10">
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="mb-6 flex rounded-2xl bg-[#EBE3D9] p-1.5">
        {(["AM", "PM"] as const).map(value => <button key={value} onClick={() => { setPeriod(value); setResult(null); setError(""); }} className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium ${period === value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>{value === "AM" ? <Sun size={18} /> : <Moon size={18} />}{value === "AM" ? "Morning" : "Evening"} · {value === period ? routineProducts.length : (routines.find(item => item.period === value)?.productIds.length ?? 0)}</button>)}
      </div>
      <p className="mb-4 text-sm leading-relaxed text-gray-500">Steps follow the order you add products.</p>
      {loading ? <p className="py-10 text-center text-sm text-gray-500">Loading routines…</p> : routineProducts.length === 0 ? <div className="mb-5 rounded-2xl border border-dashed border-[#CDBDB3] bg-white/70 px-5 py-8 text-center"><p className="font-medium text-[#3A2D2A]">No {period === "AM" ? "morning" : "evening"} steps yet</p><p className="mt-1 text-sm text-gray-500">Add products from My Rack to build this routine.</p></div> : <div className="mb-5 flex flex-col gap-3">{routineProducts.map((product, index) => <article key={product.id} className="flex items-center gap-3 rounded-2xl border border-gray-50 bg-white p-4 shadow-sm"><span className="w-5 text-center font-serif text-2xl font-bold text-[#6B2D40]">{index + 1}</span><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EBE3D9] font-serif text-lg font-bold text-[#6B2D40]">{product.name.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-bold text-[#3A2D2A]">{product.name}</h2><p className="truncate text-xs text-gray-500">{product.brand || "Brand not specified"} · {product.category}</p></div><button aria-label={`Remove ${product.name} from routine`} disabled={busy} onClick={() => void updateRoutine((routine?.productIds ?? []).filter(id => id !== product.id))} className="rounded-lg p-2 text-gray-400 hover:text-red-700"><X size={18} /></button></article>)}</div>}
      {!loading && <button onClick={() => setAdding(value => !value)} className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-4 font-medium text-gray-800"><Plus size={19} />{adding ? "Close product list" : "Add product"}</button>}
      {adding && <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">{products.length === 0 ? <p className="text-sm text-gray-500">Add a product to My Rack first.</p> : <div className="flex flex-col gap-2">{products.filter(item => !(routine?.productIds ?? []).includes(item.id)).map(product => <button key={product.id} disabled={busy} onClick={() => void updateRoutine([...(routine?.productIds ?? []), product.id])} className="rounded-xl border border-gray-100 p-3 text-left hover:border-[#6B2D40] disabled:opacity-60"><span className="block font-medium">{product.name}</span><span className="text-xs text-gray-500">{product.brand || "Brand not specified"} · {product.category}</span></button>)}</div>}</div>}
      <button onClick={() => void runAnalysis()} disabled={busy || loading} className="w-full rounded-xl bg-[#6B2D40] py-4 font-medium text-white shadow-sm disabled:opacity-60">{busy ? "Working…" : "Analyse Routine"}</button>
      {result && <section aria-live="polite" className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="mb-2 font-serif text-xl font-bold text-[#3A2D2A]">Routine check</h2><p className="mb-4 text-sm leading-relaxed text-gray-600">{result.aiSummary || (result.findings.length ? "Potential ingredient interactions were flagged." : "No interactions covered by the current rules were detected.")}</p>{result.findings.map(finding => <article key={finding.id} className="mb-3 rounded-xl bg-[#F9F6F0] p-3"><p className="mb-1 text-xs font-bold uppercase text-[#6B2D40]">{finding.priority} · {finding.category}</p><p className="text-sm">{finding.explanation}</p><p className="mt-2 text-xs text-gray-500">{finding.nextStep}</p></article>)}{result.unevaluatedProductIds.length > 0 && <p className="mt-3 text-sm text-amber-800">{result.unevaluatedProductIds.length} product(s) have no ingredient list and could not be evaluated.</p>}<p className="mt-3 text-xs text-gray-400">This check covers a limited set of ingredient patterns and is not a safety guarantee.</p></section>}
    </div>
  </div>;
}
