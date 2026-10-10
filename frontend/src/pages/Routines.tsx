import React, { useState } from 'react';
import { Sun, Moon, X, Plus } from 'lucide-react';

const routineProducts = [
  {
    id: 1,
    step: 1,
    name: "Gentle Cream Cleanser",
    brand: "Atelier Peau",
    category: "Cleanser",
    frequency: "Alternate days",
    initials: "GC",
    imageUrl: null,
  },
  {
    id: 2,
    step: 2,
    name: "Barrier Repair Cream",
    brand: "Atelier Peau",
    category: "Moisturiser",
    frequency: "Daily",
    initials: null,
    imageUrl: "/api/placeholder/80/80",
  },
  {
    id: 3,
    step: 3,
    name: "Daily Mineral SPF 50",
    brand: "Solène",
    category: "Sunscreen",
    frequency: "Alternate days",
    initials: "DM",
    imageUrl: null,
  }
];

export default function Routines() {
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');

  return (
    <div className="flex flex-col font-sans text-gray-800 -mx-4 -mt-4 bg-[#F8F5F1] min-h-screen">
      {/* Header */}
      <header className="px-6 pt-10 pb-6">
        <h1 className="text-4xl font-bold font-serif text-[#3A2D2A] mb-2">Routines</h1>
        <p className="text-gray-500 text-sm">
          The products you use each morning and evening.
        </p>
      </header>

      {/* Main Content */}
      <div className="px-6 pb-8">
        
        {/* Morning / Evening Toggle */}
        <div className="flex bg-[#EBE3D9] p-1.5 rounded-2xl mb-6">
          <button
            onClick={() => setActiveTab('morning')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'morning' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sun size={18} />
            Morning · 3
          </button>
          <button
            onClick={() => setActiveTab('evening')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'evening' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Moon size={18} />
            Evening · 3
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4 leading-relaxed pr-4">
          Steps follow the order you set. Frequency is shown only where it's on the pack or you've set it.
        </p>

        {/* Routine Steps List */}
        <div className="flex flex-col gap-3 mb-6">
          {routineProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl p-4 flex gap-4 items-center shadow-sm border border-gray-50">
              
              {/* Step Number */}
              <span className="font-serif font-bold text-2xl text-[#6B2D40] w-4 text-center">
                {product.step}
              </span>

              {/* Product Image / Initials */}
              <div className="w-14 h-14 rounded-xl bg-[#EBE3D9] flex-shrink-0 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-serif font-bold text-[#4A3B39] text-lg">{product.initials}</span>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-[#3A2D2A] truncate pr-2">{product.name}</h3>
                  <button className="text-gray-400 hover:text-gray-800 -mt-1 -mr-1 p-1">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2 truncate">
                  {product.brand} · {product.category}
                </p>
                
                {/* Frequency Badge */}
                <div className="inline-block px-3 py-1.5 rounded-lg bg-[#F9F6F0] border border-[#EBE3D9] text-xs font-medium text-gray-600">
                  {product.frequency}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl py-4 flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Plus size={20} />
            <span className="font-medium">Add product</span>
          </button>
          <button className="flex-1 bg-[#6B2D40] hover:bg-[#5E273A] text-white rounded-xl py-4 flex items-center justify-center transition-colors shadow-sm">
            <span className="font-medium">Analyse Routine</span>
          </button>
        </div>
        
      </div>
    </div>
  );
}