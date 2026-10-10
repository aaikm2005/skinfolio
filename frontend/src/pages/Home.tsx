import React, { useState } from 'react';
import { Scan, User, RefreshCcw, Check } from 'lucide-react';

export default function Home() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a temporary local URL to display the image
      const imageUrl = URL.createObjectURL(file);
      setCapturedImage(imageUrl);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    alert("Photo confirmed! Next step: Send to AI for OCR.");
    // After sending to your backend, you would typically route to an Analysis page here.
    setCapturedImage(null); 
  };

  // --- PREVIEW SCREEN ---
  // If an image is captured, show this confirmation screen instead of the home page
  if (capturedImage) {
    return (
      <div className="flex flex-col font-sans text-gray-800 -mx-4 -mt-4 bg-[#F8F5F1] min-h-screen z-50 relative p-6 pt-12">
        <h2 className="text-2xl font-bold font-serif text-[#3A2D2A] mb-2">Review Photo</h2>
        <p className="text-gray-500 mb-6 text-sm">Make sure the ingredient label is clearly visible.</p>
        
        {/* Image Preview Container */}
        <div className="flex-1 w-full bg-black/5 rounded-2xl overflow-hidden mb-8 border border-gray-200 shadow-sm flex items-center justify-center">
          <img 
            src={capturedImage} 
            alt="Captured label" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pb-8">
          <button 
            onClick={handleRetake}
            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl py-4 flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <RefreshCcw size={20} />
            <span className="font-medium">Retake</span>
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-1 bg-[#6B2D40] hover:bg-[#5E273A] text-white rounded-xl py-4 flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Check size={20} />
            <span className="font-medium">Use Photo</span>
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN HOME SCREEN ---
  return (
    <div className="flex flex-col font-sans text-gray-800 -mx-4 -mt-4">
      <header className="flex justify-between items-center px-6 pt-8 pb-4 bg-[#F8F5F1]">
        <h1 className="text-2xl font-bold font-serif text-[#5E273A]">Skinfolio</h1>
        <span className="text-sm text-gray-500">Good afternoon</span>
      </header>

      <div className="px-6 pt-4 pb-8 bg-[#F8F5F1] min-h-screen">
        <div className="w-full h-56 bg-gray-200 rounded-2xl mb-8 overflow-hidden">
          <img 
            src="/api/placeholder/400/250" 
            alt="Skincare bottles on stone" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="mb-6">
          <h2 className="text-4xl font-bold font-serif text-[#4A3B39] leading-tight mb-4">
            Know your routine.<br />
            <span className="italic text-[#5E273A]">Before you buy.</span>
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Review ingredients and potential concerns before adding a new product to your skincare routine.
          </p>
        </div>

        <label className="w-full bg-[#6B2D40] hover:bg-[#5E273A] text-white rounded-xl py-4 flex items-center justify-center gap-2 mb-4 transition-colors cursor-pointer shadow-sm">
          <Scan size={20} />
          <span className="font-medium text-lg">Check a Product</span>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden"
            onChange={handleImageCapture}
          />
        </label>
        
        <p className="text-center text-sm text-gray-500 mb-8">
          Make more informed skincare choices.
        </p>

        <hr className="border-gray-200 mb-6" />

        <div className="flex items-start justify-between">
          <div className="flex gap-4 items-start">
            <User className="text-[#6B2D40] mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-gray-900">Your skin profile</h3>
              <p className="text-sm text-gray-500">Combination skin · Sensitive to fragrance</p>
            </div>
          </div>
          <button className="text-[#6B2D40] text-sm font-medium hover:underline">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}