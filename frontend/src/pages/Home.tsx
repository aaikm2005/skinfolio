import React, { useState } from 'react';
import { Scan, User, RefreshCcw, Check, ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react';

export default function Home() {
  const [view, setView] = useState<'home' | 'scanner' | 'preview'>('home');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedFile(file);
      setCapturedImage(URL.createObjectURL(file));
      setView('preview');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setView('scanner'); 
  };

  const handleConfirm = async () => {
    if (!capturedFile) return;

    try {
      // 1. Package the image file
      const formData = new FormData();
      formData.append('image', capturedFile); 

      // 2. Send to your backend API
      // const response = await fetch('YOUR_BACKEND_URL', {
      //   method: 'POST',
      //   body: formData,
      // });
      // if (!response.ok) throw new Error("Failed to extract product data");
      // const productData = await response.json();
      
      // 3. Save to Firebase
      // await addProductToRack(productData);

      alert("Success! Photo confirmed.");
      setCapturedImage(null);
      setCapturedFile(null);
      setView('home'); 
      
    } catch (error) {
      console.error(error);
      alert("Error scanning product. Please try again.");
    }
  };

  // --- 1. PREVIEW SCREEN ---
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
          <button onClick={handleConfirm} className="flex-1 bg-[#6B2D40] hover:bg-[#5E273A] text-white rounded-xl py-4 flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Check size={20} />
            <span className="font-medium">Use Photo</span>
          </button>
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
        </div>

        {/* Sticky Continue Button */}
        <div className="fixed bottom-[72px] inset-x-0 mx-auto max-w-md bg-gradient-to-t from-[#F8F5F1] via-[#F8F5F1] to-transparent px-6 py-4">
          <button className="w-full bg-[#BCA3A7] text-white/90 rounded-xl py-4 flex items-center justify-center font-medium shadow-sm" disabled>
            Continue
          </button>
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
              <p className="text-sm text-gray-500">Combination skin · Sensitive to fragrance</p>
            </div>
          </div>
          <button className="text-[#6B2D40] text-sm font-medium hover:underline">Edit</button>
        </div>
      </div>
    </div>
  );
}