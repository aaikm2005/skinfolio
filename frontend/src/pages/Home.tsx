import React from 'react';
import { Scan, User } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col font-sans text-gray-800 -mx-4 -mt-4">
      {/* Header */}
      <header className="flex justify-between items-center px-6 pt-8 pb-4 bg-[#F8F5F1]">
        <h1 className="text-2xl font-bold font-serif text-[#5E273A]">Skinfolio</h1>
        <span className="text-sm text-gray-500">Good afternoon</span>
      </header>

      {/* Main Content */}
      <div className="px-6 pt-4 pb-8 bg-[#F8F5F1] min-h-screen">
        {/* Hero Image Placeholder */}
        <div className="w-full h-56 bg-gray-200 rounded-2xl mb-8 overflow-hidden">
          <img 
            src="/api/placeholder/400/250" 
            alt="Skincare bottles on stone" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Typography Section */}
        <div className="mb-6">
          <h2 className="text-4xl font-bold font-serif text-[#4A3B39] leading-tight mb-4">
            Know your routine.<br />
            <span className="italic text-[#5E273A]">Before you buy.</span>
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Review ingredients and potential concerns before adding a new product to your skincare routine.
          </p>
        </div>

        {/* CTA Button */}
        <button className="w-full bg-[#6B2D40] hover:bg-[#5E273A] text-white rounded-xl py-4 flex items-center justify-center gap-2 mb-4 transition-colors">
          <Scan size={20} />
          <span className="font-medium text-lg">Check a Product</span>
        </button>
        <p className="text-center text-sm text-gray-500 mb-8">
          Make more informed skincare choices.
        </p>

        <hr className="border-gray-200 mb-6" />

        {/* Skin Profile Snippet */}
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