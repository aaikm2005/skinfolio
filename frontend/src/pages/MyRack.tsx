import { useCallback, useEffect, useState } from "react";
import { Plus, Scan, Trash2, X } from "lucide-react";
import type { Product, ProductCategory, ProductStatus } from "@shared/types";
import { listProducts, removeProduct, saveProduct } from "../services/products";
import type { AnalysisResult } from "@shared/types";
import { analyse } from "../services/routines";

const categories: ProductCategory[] = ["cleanser", "toner", "serum", "moisturiser", "sunscreen", "treatment"];
const categoryLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function MyRack() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<ProductCategory>("cleanser");
  const [ingredients, setIngredients] = useState("");
  const [status, setStatus] = useState<ProductStatus>("using");
  const [checkedProducts, setCheckedProducts] = useState<Record<string, AnalysisResult>>({});
  const [checkingId, setCheckingId] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setProducts(await listProducts()); }
    catch { setError("Could not load your products. Check your connection and Firebase setup, then retry."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const addProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const product: Product = {
      id: crypto.randomUUID(), name: name.trim(), brand: brand.trim(), category,
      ingredients: ingredients.split(/[,\n]/).map((item) => item.trim()).filter(Boolean),
      instructions: "", status, createdAt: new Date().toISOString(),
    };
    try {
      await saveProduct(product);
      setProducts((current) => [product, ...current]);
      setName(""); setBrand(""); setIngredients(""); setStatus("using"); setShowForm(false);
    } catch { setError("Could not save this product. Please check your connection and try again."); }
    finally { setSaving(false); }
  };

  const updateStatus = async (product: Product, nextStatus: ProductStatus) => {
    const updated = { ...product, status: nextStatus };
    try { await saveProduct(updated); setProducts((items) => items.map((item) => item.id === product.id ? updated : item)); }
    catch { setError("Could not update the product. Please try again."); }
  };

  const deleteProduct = async (id: string) => {
    try { await removeProduct(id); setProducts((items) => items.filter((item) => item.id !== id)); }
    catch { setError("Could not delete the product. Please try again."); }
  };

  const checkProduct = async (product: Product) => {
    setCheckingId(product.id); setError("");
    try { const result = await analyse([product]); setCheckedProducts(current => ({ ...current, [product.id]: result })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not analyse this product."); }
    finally { setCheckingId(""); }
  };

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-[#F8F5F1] font-sans text-gray-800">
      <header className="px-6 pb-5 pt-10">
        <h1 className="mb-1 font-serif text-4xl font-bold text-[#3A2D2A]">My Rack</h1>
        <p className="text-gray-500">{products.length} {products.length === 1 ? "product" : "products"} saved</p>
      </header>
      <div className="px-6 pb-8">
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        <div className="mb-6 flex gap-3">
          <button onClick={() => setShowForm(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6B2D40] py-4 font-medium text-white shadow-sm hover:bg-[#5E273A]"><Plus size={19} /> Add product</button>
          <button onClick={() => window.location.assign("/?scan=1")} className="flex items-center justify-center gap-2 rounded-xl border border-[#6B2D40] bg-white px-4 py-4 font-medium text-[#6B2D40]"><Scan size={19} /> Scan</button>
        </div>

        {loading ? <p className="py-10 text-center text-sm text-gray-500">Loading your rack…</p> : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#CDBDB3] bg-white/70 px-6 py-10 text-center">
            <h2 className="mb-2 font-serif text-xl font-bold text-[#3A2D2A]">Your rack is ready</h2>
            <p className="text-sm leading-relaxed text-gray-500">Add the products you use or are considering. Add ingredients when you have them to enable routine checks.</p>
          </div>
        ) : <div className="flex flex-col gap-3">
          {products.map((product) => <article key={product.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EBE3D9] font-serif text-lg font-bold text-[#6B2D40]">{product.name.slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold text-[#3A2D2A]">{product.name}</h2>
                <p className="mb-2 truncate text-sm text-gray-500">{product.brand || "Brand not specified"} · {categoryLabel(product.category)}</p>
                <label className="sr-only" htmlFor={`status-${product.id}`}>Status for {product.name}</label>
                <select id={`status-${product.id}`} value={product.status} onChange={(event) => void updateStatus(product, event.target.value as ProductStatus)} className="rounded-full border border-[#EBE3D9] bg-[#F9F6F0] px-3 py-1 text-xs font-medium text-[#4A3B39]">
                  <option value="using">Using</option><option value="planning">Planning</option><option value="stopped">Stopped</option>
                </select>
              </div>
              <button aria-label={`Delete ${product.name}`} onClick={() => void deleteProduct(product.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-700"><Trash2 size={18} /></button>
            </div>
            <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
              {product.ingredients.length ? `${product.ingredients.length} ingredients recorded` : "Ingredients not recorded · not evaluated"}
            </div>
            <button onClick={() => void checkProduct(product)} disabled={checkingId === product.id} className="mt-3 rounded-lg border border-[#6B2D40] px-3 py-2 text-xs font-medium text-[#6B2D40] disabled:opacity-60">{checkingId === product.id ? "Checking…" : "Check this product"}</button>
            {checkedProducts[product.id] && (() => {
              const check = checkedProducts[product.id];
              const assessment = check.productAssessments.find(item => item.productId === product.id);
              return <div className="mt-3 rounded-xl bg-[#F9F6F0] p-3 text-sm">
                <p className="font-semibold text-[#3A2D2A]">Product check</p>
                <p className="mt-1 text-gray-600">{assessment?.message}</p>
                {assessment?.recognizedIngredients.length ? <p className="mt-2 text-xs text-gray-600">Matched screening ingredients: {assessment.recognizedIngredients.join(", ")}</p> : null}
                <p className="mt-2 text-xs text-gray-500">{check.aiSummary}</p>
                {check.aiGenerated === false && <p className="mt-2 text-xs text-amber-800">This is a fallback summary; Gemini did not return an explanation. Check the backend logs and Gemini API key or quota.</p>}
                <p className="mt-2 text-xs text-gray-400">Ingredient screening covers a limited set of patterns. It is not a safety guarantee.</p>
              </div>;
            })()}
          </article>)}
        </div>}
      </div>

      {showForm && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
        <form onSubmit={(event) => void addProduct(event)} className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#F8F5F1] p-6 pb-8 sm:rounded-3xl">
          <div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-2xl font-bold text-[#3A2D2A]">Add a product</h2><button type="button" aria-label="Close" onClick={() => setShowForm(false)} className="rounded-full p-2 text-gray-500 hover:bg-white"><X size={20} /></button></div>
          <label className="mb-4 block text-sm font-medium">Product name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-3 font-normal outline-none focus:border-[#6B2D40]" placeholder="e.g. Gentle cleanser" /></label>
          <label className="mb-4 block text-sm font-medium">Brand<input value={brand} onChange={(event) => setBrand(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-3 font-normal outline-none focus:border-[#6B2D40]" placeholder="Optional" /></label>
          <label className="mb-4 block text-sm font-medium">Category<select value={category} onChange={(event) => setCategory(event.target.value as ProductCategory)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-3 font-normal">{categories.map((item) => <option key={item} value={item}>{categoryLabel(item)}</option>)}</select></label>
          <label className="mb-4 block text-sm font-medium">Ingredients<textarea value={ingredients} onChange={(event) => setIngredients(event.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-3 font-normal outline-none focus:border-[#6B2D40]" placeholder="Separate ingredients with commas or new lines" /></label>
          <label className="mb-6 block text-sm font-medium">Status<select value={status} onChange={(event) => setStatus(event.target.value as ProductStatus)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-3 font-normal"><option value="using">Using</option><option value="planning">Planning</option><option value="stopped">Stopped</option></select></label>
          <button disabled={saving} className="w-full rounded-xl bg-[#6B2D40] py-4 font-medium text-white disabled:opacity-60">{saving ? "Saving…" : "Save product"}</button>
        </form>
      </div>}
    </div>
  );
}
