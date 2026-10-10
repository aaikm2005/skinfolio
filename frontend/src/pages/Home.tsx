import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Scan, User, ArrowLeft, Camera, Image as ImageIcon, Edit2 } from 'lucide-react';
import type { IngredientListStatus, Product, ProductCategory } from '@shared/types';
import { mergeProductExtractions, validateProductExtraction, type ProductExtraction } from '@shared/extraction';
import { saveProduct } from '../services/products';
import { getProfile } from '../services/profile';
import { requestProductExtraction, resolveApiBaseUrl } from '../services/api';

const categoryLabel = (category: string) => category.charAt(0).toUpperCase() + category.slice(1);
const IMAGE_TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
// Leave headroom below Vercel Functions' 4.5 MB request-body limit.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_SCAN_PHOTOS = 4;
const getImageMimeType = (file: File) => file.type || IMAGE_TYPES[file.name.split('.').pop()?.toLowerCase() ?? ''] || '';

interface CapturedPhoto { file: File; url: string; side: 'front' | 'back' }

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // State to manage which screen is currently visible
  const [view, setView] = useState<'home' | 'scanner' | 'preview'>('home');
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [extracted, setExtracted] = useState<ProductExtraction | null>(null);
  const [extractedListComplete, setExtractedListComplete] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [profileLabel, setProfileLabel] = useState('Set up your skin profile');
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [manualCategory, setManualCategory] = useState<ProductCategory>('cleanser');
  const [manualIngredients, setManualIngredients] = useState('');
  const [manualListComplete, setManualListComplete] = useState(false);

  useEffect(() => {
    if (searchParams.get('scan') === '1') {
      setView('scanner');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    getProfile().then(profile => {
      if (profile) setProfileLabel(`${profile.skinType === 'unsure' ? 'Skin type not set' : `${profile.skinType[0].toUpperCase()}${profile.skinType.slice(1)} skin`}${profile.concerns.length ? ` · ${profile.concerns.join(', ')}` : ''}`);
    }).catch(() => setProfileLabel('Your skin profile'));
  }, []);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>, side: CapturedPhoto['side']) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    const acceptable: File[] = [];
    const issues: string[] = [];
    for (const file of files) {
      const mimeType = getImageMimeType(file);
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
        issues.push(`${file.name} is not supported; use JPEG, PNG, or WebP.`);
      } else if (file.size === 0) {
        issues.push(`${file.name} is empty; choose another photo.`);
      } else if (file.size > MAX_IMAGE_BYTES) {
        issues.push(`${file.name} is larger than 4 MB; choose a smaller photo.`);
      } else acceptable.push(file);
    }
    const available = MAX_SCAN_PHOTOS - capturedPhotos.length;
    if (acceptable.length > available) issues.push(`You can add up to ${MAX_SCAN_PHOTOS} photos for one product.`);
    const additions = acceptable.slice(0, Math.max(available, 0)).map(file => ({ file, url: URL.createObjectURL(file), side }));
    if (additions.length) {
      setCapturedPhotos(current => [...current, ...additions]);
      setExtracted(null);
      setView('preview');
      setScanError(issues.join(' '));
    } else {
      setScanError(issues.join(' ') || `You can add up to ${MAX_SCAN_PHOTOS} photos for one product.`);
    }
  };

  const removePhoto = (index: number) => {
    if (capturedPhotos.length <= 1) setView('scanner');
    setCapturedPhotos(current => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((_, photoIndex) => photoIndex !== index);
    });
    setExtracted(null);
    setScanError('');
  };

  const discardScan = () => {
    capturedPhotos.forEach(photo => URL.revokeObjectURL(photo.url));
    setCapturedPhotos([]);
    setExtracted(null);
    setScanError('');
    setView('home');
  };

  const handleConfirm = async () => {
    if (!capturedPhotos.length) return;

    setScanning(true);
    setScanError('');
    try {
      const apiUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL, import.meta.env.DEV);
      const results: ProductExtraction[] = [];
      for (const photo of capturedPhotos) {
        const contentType = getImageMimeType(photo.file);
        console.info('[Skinfolio API] POST /api/extract', {
          origin: new URL(apiUrl).origin,
          contentType,
          imageBytes: photo.file.size,
        });
        const payload = await requestProductExtraction(apiUrl, photo.file, contentType);
        try {
          results.push(validateProductExtraction(payload));
        } catch {
          throw new Error('The API returned an invalid extraction response. Check the backend response and Function logs.');
        }
      }
      const combined = mergeProductExtractions(results);
      setExtracted(combined);
      setExtractedListComplete(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not scan this product. Please try again.';
      console.error('[Skinfolio API] Product extraction failed', { message });
      setScanError(message);
    } finally { setScanning(false); }
  };

  const handleSaveExtracted = async () => {
    if (!extracted?.name.trim()) { setScanError('Add a product name before saving.'); return; }
    setSaving(true); setScanError('');
    // Uncertain AI readings are shown for correction but are excluded from matching unless the user confirms the full list.
    const ingredients = extracted.ingredients
      .filter(item => item.certainty === 'clear' || extractedListComplete)
      .map(item => item.name.trim()).filter(Boolean);
    const ingredientListStatus: IngredientListStatus = ingredients.length === 0 ? 'unknown' : extractedListComplete ? 'complete' : 'partial';
    const product: Product = {
      name: extracted.name.trim(), brand: extracted.brand.trim(), category: extracted.category,
      ingredients, instructions: '', ingredientListStatus,
      extractionRawText: extracted.rawText,
      extractionUncertaintyNotes: extractedListComplete ? [] : [...extracted.uncertaintyNotes, ...extracted.ingredients.filter(item => item.certainty === 'uncertain').map(item => `Verify ingredient spelling: ${item.name}`)],
      id: crypto.randomUUID(), status: 'planning', createdAt: new Date().toISOString(),
    };
    try {
      await saveProduct(product);
      capturedPhotos.forEach(photo => URL.revokeObjectURL(photo.url));
      setCapturedPhotos([]); setExtracted(null); setView('home');
      setSuccessMessage('Product saved to My Rack.');
    } catch { setScanError('Product details were read, but could not be saved. Check Firebase setup and try again.'); }
    finally { setSaving(false); }
  };

  const handleManualSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!manualName.trim()) return;
    setSaving(true); setScanError('');
    const product: Product = {
      id: crypto.randomUUID(), name: manualName.trim(), brand: manualBrand.trim(), category: manualCategory,
      ingredients: manualIngredients.split(/[,\n]/).map(item => item.trim()).filter(Boolean),
      ingredientListStatus: manualIngredients.trim() ? (manualListComplete ? 'complete' : 'partial') : 'unknown',
      instructions: '', status: 'planning', createdAt: new Date().toISOString(),
    };
    try {
      await saveProduct(product);
      setManualName(''); setManualBrand(''); setManualIngredients(''); setManualListComplete(false); setView('home');
      setSuccessMessage('Product saved to My Rack.');
    } catch { setScanError('Could not save this product. Check Firebase setup and try again.'); }
    finally { setSaving(false); }
  };

  // --- 1. PREVIEW SCREEN ---
  if (view === 'preview' && capturedPhotos.length > 0 && extracted) {
    return <div className="-mx-4 -mt-4 min-h-screen bg-[#F8F5F1] p-6 pt-12 font-sans text-gray-800">
      <h2 className="mb-2 font-serif text-2xl font-bold text-[#3A2D2A]">Review product details</h2>
      <p className="mb-5 text-sm text-gray-500">AI extraction can make mistakes. Check every photo and correct anything before saving.</p>
      {scanError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{scanError}</p>}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{capturedPhotos.map((photo, index) => <div key={photo.url} className="relative h-28 overflow-hidden rounded-xl bg-white"><img src={photo.url} alt={`${photo.side} of product packaging, photo ${index + 1}`} className="h-full w-full object-contain" /><button type="button" onClick={() => removePhoto(index)} className="absolute right-1 top-1 rounded-lg bg-white/90 px-2 py-1 text-xs text-gray-800">Remove</button></div>)}</div>
      <p className={`mb-3 rounded-xl p-3 text-sm ${extracted.ingredientListStatus === 'complete' ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
        {extracted.ingredientListStatus === 'complete' ? 'The photo appears to show a complete readable ingredient list. Verify it against the package.' : extracted.ingredientListStatus === 'partial' ? 'The ingredient list may be incomplete or partly unreadable. Add another photo or verify every line before saving.' : 'No ingredient list was readable in these photos. Add a clear label photo or enter ingredients manually.'}
      </p>
      {extracted.uncertaintyNotes.length > 0 && <ul className="mb-3 list-disc rounded-xl bg-amber-50 p-3 pl-8 text-sm text-amber-900">{extracted.uncertaintyNotes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}</ul>}
      {extracted.ingredients.some(item => item.certainty === 'uncertain') && <p className="mb-2 text-sm text-amber-900">Check spelling for: {extracted.ingredients.filter(item => item.certainty === 'uncertain').map(item => item.name).join(', ')}</p>}
      <label className="mb-3 block text-sm font-medium">Product name<input value={extracted.name} onChange={e => setExtracted({ ...extracted, name: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      <label className="mb-3 block text-sm font-medium">Brand<input value={extracted.brand} onChange={e => setExtracted({ ...extracted, brand: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      <label className="mb-3 block text-sm font-medium">Category<select value={extracted.category} onChange={e => setExtracted({ ...extracted, category: e.target.value as ProductCategory })} className="mt-1 w-full rounded-xl border bg-white p-3">{['cleanser','toner','serum','moisturiser','sunscreen','treatment'].map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}</select></label>
      <label className="mb-5 block text-sm font-medium">Ingredients<textarea value={extracted.ingredients.map(item => item.name).join('\n')} onChange={e => setExtracted({ ...extracted, ingredients: e.target.value.split(/\r?\n/).map(name => name.trim()).filter(Boolean).map(name => ({ name, certainty: 'clear' as const })) })} rows={7} className="mt-1 w-full rounded-xl border bg-white p-3" placeholder="One ingredient per line" /><span className="mt-1 block text-xs font-normal text-gray-500">Edit, remove, or add ingredients, one per line. AI text must be checked against the package.</span></label>
      {extracted.ingredients.length > 0 && <label className="mb-5 flex items-start gap-2 text-sm text-gray-600"><input type="checkbox" checked={extractedListComplete} onChange={e => setExtractedListComplete(e.target.checked)} className="mt-1 accent-[#6B2D40]" />I verified this is the complete ingredient list on the label</label>}
      <details className="mb-5 rounded-xl border border-gray-200 bg-white p-3"><summary className="cursor-pointer text-sm font-medium">View extracted label text</summary><pre className="mt-3 whitespace-pre-wrap break-words text-xs text-gray-600">{extracted.rawText || 'No label text was readable.'}</pre></details>
      <div className="flex flex-col gap-3 sm:flex-row"><button onClick={() => setView('scanner')} className="flex-1 rounded-xl border bg-white py-4">Add or retake photo</button><button onClick={handleSaveExtracted} disabled={saving} className="flex-1 rounded-xl bg-[#6B2D40] py-4 font-medium text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save product'}</button></div>
    </div>;
  }

  if (view === 'preview' && capturedPhotos.length > 0 && !extracted) {
    return (
      <div className="flex flex-col font-sans text-gray-800 -mx-4 -mt-4 bg-[#F8F5F1] min-h-screen z-50 relative p-6 pt-12">
        <h2 className="text-2xl font-bold font-serif text-[#3A2D2A] mb-2">Review photos</h2>
        <p className="text-gray-500 mb-4 text-sm">Check focus and framing. You can add up to {MAX_SCAN_PHOTOS} photos, such as the front and separate ingredient panels.</p>
        {scanError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{scanError}</p>}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{capturedPhotos.map((photo, index) => <div key={photo.url} className="relative h-36 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"><img src={photo.url} alt={`${photo.side} packaging photo ${index + 1}`} className="h-full w-full object-contain" /><button type="button" onClick={() => removePhoto(index)} className="absolute right-1 top-1 rounded-lg bg-white/90 px-2 py-1 text-xs">Remove</button></div>)}</div>
        <div className="mt-auto flex flex-col gap-3 pb-8 sm:flex-row">
          <button onClick={() => setView('scanner')} className="flex-1 rounded-xl border border-gray-200 bg-white py-4">Add another photo</button>
          <button onClick={handleConfirm} disabled={scanning || !capturedPhotos.length} className="flex-1 rounded-xl bg-[#6B2D40] py-4 text-white shadow-sm disabled:opacity-60"><span className="font-medium">{scanning ? 'Reading photo(s)…' : 'Use Photo(s)'}</span></button>
        </div>
      </div>
    );
  }

  // --- 2. SCANNER SELECTION SCREEN ---
  if (view === 'scanner') {
    return (
      <div className="flex flex-col font-sans text-gray-800 -mx-4 -mt-4 bg-[#F8F5F1] min-h-screen z-50 relative">
        {/* Header */}
        <div className="flex items-center px-6 pt-12 pb-4 relative">
          <button onClick={discardScan} className="absolute left-6 text-gray-600 hover:text-gray-900 p-1">
            <ArrowLeft size={24} />
          </button>
          <h1 className="w-full text-center font-semibold text-gray-900 text-lg">Check a Product</h1>
        </div>

        <div className="px-6 pt-6 pb-24 overflow-y-auto">
          <h2 className="text-3xl font-bold font-serif text-[#3A2D2A] mb-3 leading-tight">What are you considering?</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Capture the front for product details and each ingredient panel for a more complete read. You can add up to {MAX_SCAN_PHOTOS} photos.
          </p>

          {/* Tabs */}
          <div className="flex bg-[#EBE3D9] p-1.5 rounded-2xl mb-8">
            <button onClick={() => setManualMode(false)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm ${!manualMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              <Scan size={18} /> Scan packaging
            </button>
            <button onClick={() => setManualMode(true)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm ${manualMode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              <Edit2 size={18} /> Enter manually
            </button>
          </div>

          {scanError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{scanError}</p>}
          {manualMode ? <form onSubmit={handleManualSave} className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="mb-4 block text-sm font-medium">Product name<input required value={manualName} onChange={e => setManualName(e.target.value)} className="mt-1.5 w-full rounded-xl border p-3 font-normal" placeholder="e.g. Daily moisturiser" /></label>
            <label className="mb-4 block text-sm font-medium">Brand<input value={manualBrand} onChange={e => setManualBrand(e.target.value)} className="mt-1.5 w-full rounded-xl border p-3 font-normal" /></label>
            <label className="mb-4 block text-sm font-medium">Category<select value={manualCategory} onChange={e => setManualCategory(e.target.value as ProductCategory)} className="mt-1.5 w-full rounded-xl border p-3 font-normal">{['cleanser','toner','serum','moisturiser','sunscreen','treatment'].map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}</select></label>
            <label className="mb-4 block text-sm font-medium">Ingredients<textarea value={manualIngredients} onChange={e => setManualIngredients(e.target.value)} rows={4} className="mt-1.5 w-full rounded-xl border p-3 font-normal" placeholder="Separate with commas or new lines" /></label>
            {manualIngredients.trim() && <label className="mb-4 flex items-start gap-2 text-sm font-normal text-gray-600"><input type="checkbox" checked={manualListComplete} onChange={e => setManualListComplete(e.target.checked)} className="mt-1 accent-[#6B2D40]" />I entered the complete ingredient list on the label</label>}
            <button disabled={saving} className="w-full rounded-xl bg-[#6B2D40] py-3 font-medium text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save product'}</button>
          </form> : <>
          {/* Photo Cards Grid */}
          <div className="flex gap-4 mb-8">
            {/* Front of Pack */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center text-center shadow-sm">
              <span className="text-xs font-bold text-gray-700 mb-6 self-start">Front of pack</span>
              <Camera className="text-[#6B2D40] mb-3" size={28} strokeWidth={1.5} />
              <p className="text-xs text-gray-500 mb-6 h-8">Product name and brand</p>
              
              <label className="w-full bg-[#6B2D40] text-white text-xs font-medium rounded-lg py-2 mb-2 flex items-center justify-center gap-1.5 cursor-pointer">
                <Camera size={14} /> Take photo
                <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple className="hidden" onChange={e => handleImageCapture(e, 'front')} />
              </label>
              <label className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg py-2 flex items-center justify-center gap-1.5 cursor-pointer">
                <ImageIcon size={14} /> Upload
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e => handleImageCapture(e, 'front')} />
              </label>
            </div>

            {/* Back of Pack */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center text-center shadow-sm">
              <span className="text-xs font-bold text-gray-700 mb-6 self-start">Back of pack</span>
              <Camera className="text-[#6B2D40] mb-3" size={28} strokeWidth={1.5} />
              <p className="text-xs text-gray-500 mb-6 h-8">Ingredients and directions</p>
              
              <label className="w-full bg-[#6B2D40] text-white text-xs font-medium rounded-lg py-2 mb-2 flex items-center justify-center gap-1.5 cursor-pointer">
                <Camera size={14} /> Take photo
                <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple className="hidden" onChange={e => handleImageCapture(e, 'back')} />
              </label>
              <label className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg py-2 flex items-center justify-center gap-1.5 cursor-pointer">
                <ImageIcon size={14} /> Upload
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e => handleImageCapture(e, 'back')} />
              </label>
            </div>
          </div>

          {/* Info Section */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 text-sm mb-2">For a clear read</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Photograph the full ingredient list in focus with good, even lighting. Avoid glare, shadows, blur, and cut-off edges; use separate close-ups for small print or multiple label panels. Use JPEG, PNG, or WebP images up to 8 MB each.
            </p>
          </div>
          </>}
        </div>

      </div>
    );
  }

  // --- 3. MAIN HOME SCREEN ---
  return (
    <div className="flex flex-col font-sans text-gray-800 -mx-4 -mt-4">
      <header className="flex justify-between items-center px-6 pt-8 pb-4 bg-[#F8F5F1]">
        <h1 className="text-2xl font-bold font-serif text-[#5E273A]">Skinfolio</h1>
        <span className="text-sm text-gray-500">Good afternoon</span>
      </header>

      <div className="px-6 pt-4 pb-8 bg-[#F8F5F1] min-h-screen">
        {successMessage && <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{successMessage}</p>}
        <div className="w-full h-56 bg-gray-200 rounded-2xl mb-8 overflow-hidden">
          <img src="/skincare-homepage-photo.jpg" alt="Skincare bottles on stone" className="w-full h-full object-cover" />
        </div>

        <div className="mb-6">
          <h2 className="text-4xl font-bold font-serif text-[#4A3B39] leading-tight mb-4">
            Know your routine.<br /><span className="italic text-[#5E273A]">Before you buy.</span>
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Review ingredients and potential concerns before adding a new product to your skincare routine.
          </p>
        </div>

        <button 
          onClick={() => setView('scanner')}
          className="w-full bg-[#6B2D40] hover:bg-[#5E273A] text-white rounded-xl py-4 flex items-center justify-center gap-2 mb-4 transition-colors shadow-sm"
        >
          <Scan size={20} />
          <span className="font-medium text-lg">Check a Product</span>
        </button>
        
        <p className="text-center text-sm text-gray-500 mb-8">Make more informed skincare choices.</p>
        <hr className="border-gray-200 mb-6" />

        <div className="flex items-start justify-between">
          <div className="flex gap-4 items-start">
            <User className="text-[#6B2D40] mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-gray-900">Your skin profile</h3>
              <p className="text-sm text-gray-500">{profileLabel}</p>
            </div>
          </div>
          <button onClick={() => navigate('/profile')} className="text-[#6B2D40] text-sm font-medium hover:underline">Edit</button>
        </div>
      </div>
    </div>
  );
}
