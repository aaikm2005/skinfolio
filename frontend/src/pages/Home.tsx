import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Scan, User, RefreshCcw, Check, ArrowLeft, Camera, Image as ImageIcon, Edit2 } from 'lucide-react';
import type { IngredientListStatus, Product, ProductCategory } from '@shared/types';
import { saveProduct } from '../services/products';
import { getProfile } from '../services/profile';

const categoryLabel = (category: string) => category.charAt(0).toUpperCase() + category.slice(1);

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // State to manage which screen is currently visible
  const [view, setView] = useState<'home' | 'scanner' | 'preview'>('home');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<{ name: string; brand: string; category: ProductCategory; ingredients: string[]; instructions: string } | null>(null);
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

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedFile(file);
      setCapturedImage(URL.createObjectURL(file));
      setView('preview');
    }
  };

  const handleRetake = () => {
    if (capturedImage) URL.revokeObjectURL(capturedImage);
    setCapturedImage(null);
    setCapturedFile(null);
    setExtracted(null);
    setScanError('');
    setView('scanner'); // Go back to the scanner choice screen
  };

  const handleConfirm = async () => {
    if (!capturedFile) return;

    setScanning(true);
    setScanError('');
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      if (!apiUrl) throw new Error('Set VITE_API_URL to connect to the Skinfolio API.');
      const response = await fetch(`${apiUrl}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': capturedFile.type || 'image/jpeg' },
        body: capturedFile,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Product extraction failed. Please retry.');
      setExtracted(data);
      setExtractedListComplete(false);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Could not scan this product. Please try again.');
    } finally { setScanning(false); }
  };

  const handleSaveExtracted = async () => {
    if (!extracted?.name.trim()) { setScanError('Add a product name before saving.'); return; }
    setSaving(true); setScanError('');
    const ingredientListStatus: IngredientListStatus = extracted.ingredients.length === 0 ? 'unknown' : extractedListComplete ? 'complete' : 'partial';
    const product: Product = { ...extracted, name: extracted.name.trim(), brand: extracted.brand.trim(), ingredientListStatus, id: crypto.randomUUID(), status: 'planning', createdAt: new Date().toISOString() };
    try {
      await saveProduct(product);
      if (capturedImage) URL.revokeObjectURL(capturedImage);
      setCapturedImage(null); setCapturedFile(null); setExtracted(null); setView('home');
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
  if (view === 'preview' && capturedImage && extracted) {
    return <div className="-mx-4 -mt-4 min-h-screen bg-[#F8F5F1] p-6 pt-12 font-sans text-gray-800">
      <h2 className="mb-2 font-serif text-2xl font-bold text-[#3A2D2A]">Review product details</h2>
      <p className="mb-5 text-sm text-gray-500">AI extraction can make mistakes. Check the label and correct anything before saving.</p>
      {scanError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{scanError}</p>}
      <div className="mb-5 flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-white"><img src={capturedImage} alt="Product packaging" className="h-full w-full object-contain" /></div>
      <label className="mb-3 block text-sm font-medium">Product name<input value={extracted.name} onChange={e => setExtracted({ ...extracted, name: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      <label className="mb-3 block text-sm font-medium">Brand<input value={extracted.brand} onChange={e => setExtracted({ ...extracted, brand: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      <label className="mb-3 block text-sm font-medium">Category<select value={extracted.category} onChange={e => setExtracted({ ...extracted, category: e.target.value as ProductCategory })} className="mt-1 w-full rounded-xl border bg-white p-3">{['cleanser','toner','serum','moisturiser','sunscreen','treatment'].map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}</select></label>
      <label className="mb-5 block text-sm font-medium">Ingredients<textarea value={extracted.ingredients.join(', ')} onChange={e => setExtracted({ ...extracted, ingredients: e.target.value.split(/[,\n]/).map(x => x.trim()).filter(Boolean) })} rows={4} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      {extracted.ingredients.length > 0 && <label className="mb-5 flex items-start gap-2 text-sm text-gray-600"><input type="checkbox" checked={extractedListComplete} onChange={e => setExtractedListComplete(e.target.checked)} className="mt-1 accent-[#6B2D40]" />I verified this is the complete ingredient list on the label</label>}
      <div className="flex gap-3"><button onClick={handleRetake} className="flex-1 rounded-xl border bg-white py-4">Retake</button><button onClick={handleSaveExtracted} disabled={saving} className="flex-1 rounded-xl bg-[#6B2D40] py-4 font-medium text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save product'}</button></div>
    </div>;
  }

  if (view === 'preview' && capturedImage) {
    return (
      <div className="flex flex-col font-sans text-gray-800 -mx-4 -mt-4 bg-[#F8F5F1] min-h-screen z-50 relative p-6 pt-12">
        <h2 className="text-2xl font-bold font-serif text-[#3A2D2A] mb-2">Review Photo</h2>
        <p className="text-gray-500 mb-6 text-sm">Make sure the ingredient label is clearly visible.</p>
        
        <div className="flex-1 w-full bg-black/5 rounded-2xl overflow-hidden mb-8 border border-gray-200 shadow-sm flex items-center justify-center">
          <img src={capturedImage} alt="Captured label" className="w-full h-full object-contain" />
        </div>

        <div className="flex gap-3 pb-8">
          <button onClick={handleRetake} className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl py-4 flex items-center justify-center gap-2 transition-colors shadow-sm">
            <RefreshCcw size={20} />
            <span className="font-medium">Retake</span>
          </button>
          <button onClick={handleConfirm} disabled={scanning} className="flex-1 bg-[#6B2D40] hover:bg-[#5E273A] text-white rounded-xl py-4 flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60">
            <Check size={20} />
            <span className="font-medium">{scanning ? 'Reading label…' : 'Use Photo'}</span>
          </button>
        </div>
        {scanError && <p role="alert" className="-mt-5 mb-5 text-sm text-red-700">{scanError}</p>}
      </div>
    );
  }

  // --- 2. SCANNER SELECTION SCREEN ---
  if (view === 'scanner') {
    return (
      <div className="flex flex-col font-sans text-gray-800 -mx-4 -mt-4 bg-[#F8F5F1] min-h-screen z-50 relative">
        {/* Header */}
        <div className="flex items-center px-6 pt-12 pb-4 relative">
          <button onClick={() => setView('home')} className="absolute left-6 text-gray-600 hover:text-gray-900 p-1">
            <ArrowLeft size={24} />
          </button>
          <h1 className="w-full text-center font-semibold text-gray-900 text-lg">Check a Product</h1>
        </div>

        <div className="px-6 pt-6 pb-24 overflow-y-auto">
          <h2 className="text-3xl font-bold font-serif text-[#3A2D2A] mb-3 leading-tight">What are you considering?</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Photograph the packaging to extract the details from the label.
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
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
              </label>
              <label className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg py-2 flex items-center justify-center gap-1.5 cursor-pointer">
                <ImageIcon size={14} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={handleImageCapture} />
              </label>
            </div>

            {/* Back of Pack */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center text-center shadow-sm">
              <span className="text-xs font-bold text-gray-700 mb-6 self-start">Back of pack</span>
              <Camera className="text-[#6B2D40] mb-3" size={28} strokeWidth={1.5} />
              <p className="text-xs text-gray-500 mb-6 h-8">Ingredients and directions</p>
              
              <label className="w-full bg-[#6B2D40] text-white text-xs font-medium rounded-lg py-2 mb-2 flex items-center justify-center gap-1.5 cursor-pointer">
                <Camera size={14} /> Take photo
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
              </label>
              <label className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg py-2 flex items-center justify-center gap-1.5 cursor-pointer">
                <ImageIcon size={14} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={handleImageCapture} />
              </label>
            </div>
          </div>

          {/* Info Section */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 text-sm mb-2">For a clear read</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Fill the frame with the label and avoid glare from lights. Make sure the full ingredient list is visible, including small print.
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
