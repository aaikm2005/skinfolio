import React, { useState } from 'react';
import { Circle, CircleDot, Check } from 'lucide-react';

const skinTypes = [
  { id: 'oily', label: 'Oily', desc: 'Shine across most of the face' },
  { id: 'dry', label: 'Dry', desc: 'Often feels tight or flaky' },
  { id: 'combination', label: 'Combination', desc: 'Oily T-zone, drier elsewhere' },
  { id: 'normal', label: 'Normal', desc: 'Rarely oily or tight' },
];

const concernsList = ['Breakouts', 'Dehydration', 'Redness'];

export default function SkinProfile() {
  const [selectedType, setSelectedType] = useState('combination');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(['Dehydration']);

  const toggleConcern = (concern: string) => {
    setSelectedConcerns(prev => 
      prev.includes(concern) 
        ? prev.filter(c => c !== concern) 
        : [...prev, concern]
    );
  };

  return (
    <div className="flex flex-col font-sans text-gray-800 -mx-4 -mt-4 bg-[#F8F5F1] min-h-screen relative">
      {/* Scrollable Content */}
      <div className="px-6 pt-10 pb-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-serif text-[#3A2D2A] mb-3">Skin profile</h1>
          <p className="text-gray-600 leading-relaxed text-sm">
            Self-reported details that tailor each check. This isn't a medical diagnosis.
          </p>
        </div>

        {/* Skin Type Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold font-serif text-[#3A2D2A] mb-4">Skin type</h2>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            {skinTypes.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-colors ${
                    isSelected 
                      ? 'border-[#6B2D40] bg-[#F4EBEB]' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {isSelected ? (
                      <CircleDot size={18} className="text-[#6B2D40]" />
                    ) : (
                      <Circle size={18} className="text-[#CBAA9E]" />
                    )}
                    <span className={`font-bold ${isSelected ? 'text-[#6B2D40]' : 'text-gray-800'}`}>
                      {type.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 pr-2 line-clamp-2 leading-relaxed">
                    {type.desc}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Not Sure Option (Full Width) */}
          <button
            onClick={() => setSelectedType('notsure')}
            className={`w-full flex flex-col items-start p-4 rounded-xl border text-left transition-colors ${
              selectedType === 'notsure' 
                ? 'border-[#6B2D40] bg-[#F4EBEB]' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {selectedType === 'notsure' ? (
                <CircleDot size={18} className="text-[#6B2D40]" />
              ) : (
                <Circle size={18} className="text-[#CBAA9E]" />
              )}
              <span className={`font-bold ${selectedType === 'notsure' ? 'text-[#6B2D40]' : 'text-gray-800'}`}>
                Not sure
              </span>
            </div>
            <span className="text-xs text-gray-500">Skip type-based checks</span>
          </button>
        </div>

        {/* Skin Concerns Section */}
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#3A2D2A] mb-2">Skin concerns</h2>
          <p className="text-gray-500 text-sm mb-4">Optional — choose any that apply.</p>
          
          <div className="flex flex-wrap gap-2.5">
            {concernsList.map((concern) => {
              const isSelected = selectedConcerns.includes(concern);
              return (
                <button
                  key={concern}
                  onClick={() => toggleConcern(concern)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors ${
                    isSelected 
                      ? 'border-[#6B2D40] bg-[#F4EBEB] text-[#6B2D40]' 
                      : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {isSelected && <Check size={16} strokeWidth={2.5} />}
                  {concern}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Button */}
      <div className="fixed bottom-[72px] inset-x-0 mx-auto max-w-md bg-[#F8F5F1] px-6 py-4 border-t border-gray-100/50">
        <button className="w-full bg-[#BCA3A7] hover:bg-[#A98E92] text-white/90 rounded-xl py-4 flex items-center justify-center font-medium text-lg transition-colors shadow-sm">
          Update profile
        </button>
      </div>
    </div>
  );
}
