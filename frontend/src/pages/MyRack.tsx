import React from 'react';
import { Scan, MoreHorizontal } from 'lucide-react';

const savedProducts = [
  { id: 1, name: "Gentle Cream Cleanser", brand: "Atelier Peau", category: "Cleanser", infoStatus: "Complete", infoLevel: 3, routine: ["AM", "PM"], initials: "GC", imageUrl: null },
  { id: 2, name: "Glycolic Clarifying Toner", brand: "Lune & Co", category: "Toner", infoStatus: "Complete", infoLevel: 3, routine: ["PM"], initials: null, imageUrl: "/api/placeholder/80/80" },
  { id: 3, name: "Barrier Repair Cream", brand: "Atelier Peau", category: "Moisturiser", infoStatus: "Partial", infoLevel: 2, routine: ["AM", "PM"], initials: null, imageUrl: "/api/placeholder/80/80" },
  { id: 4, name: "Daily Mineral SPF 50", brand: "Solène", category: "Sunscreen", infoStatus: "Complete", infoLevel: 3, routine: ["AM"], initials: "DM", imageUrl: null }
];

export default function MyRack() {
  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Camera capture working! File: ${file.name}`);
    }
  };

  return (
    <div className="flex flex-col font-sans text-gray-800 -mx-4 -mt-4 bg-[#F8F5F1] min-h-screen">
      <header className="px-6 pt-10 pb-4">
        <h1 className="text-4xl font-bold font-serif text-[#3A2D2A] mb-1">My Rack</h1>
        <p className="text-gray-500">{savedProducts.length} saved products</p>
      </header>

      <div className="px-6 pb-8">
        {/* Updated Camera Button */}
        <label className="w-full bg-[#6B2D40] hover:bg-[#5E273A] text-white rounded-xl py-4 flex items-center justify-center gap-2 mb-6 transition-colors shadow-sm cursor-pointer">
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

        <div className="flex flex-col gap-4">
          {savedProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl p-4 flex gap-4 items-center shadow-sm border border-gray-50">
              <div className="w-16 h-16 rounded-xl bg-[#EBE3D9] flex-shrink-0 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-serif font-bold text-[#4A3B39] text-xl">{product.initials}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-[#3A2D2A] truncate pr-2">{product.name}</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-2 truncate">
                  {product.brand} · {product.category}
                </p>
                
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div key={level} className={`h-1.5 w-4 rounded-full ${level <= product.infoLevel ? 'bg-[#4A3B39]' : 'bg-[#EBE3D9]'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-[#4A3B39]">Information: {product.infoStatus}</span>
                </div>

                <div className="flex gap-2">
                  {product.routine.map((time) => (
                    <span key={time} className="px-3 py-0.5 rounded-full bg-[#F5EFE6] text-xs font-semibold text-[#4A3B39]">
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}