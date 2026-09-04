import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CornerDownLeft, Home, X } from 'lucide-react';

interface TvRemoteOverlayProps {
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right' | 'select' | 'back' | 'home') => void;
}

export const TvRemoteOverlay: React.FC<TvRemoteOverlayProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-14 left-6 z-40" dir="ltr">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[#111111] hover:bg-gray-800 border border-gray-700 px-4 py-2.5 text-xs font-bold text-gray-200 shadow-2xl transition-all"
        >
          <span className="text-base">📺</span> شبیه‌ساز ریموت TV (D-Pad)
        </button>
      ) : (
        <div className="relative rounded-3xl border border-gray-800 bg-[#111111] p-4 text-gray-200 shadow-2xl backdrop-blur-md w-56 animate-in fade-in zoom-in-95">
          
          <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <span>📺</span> شبیه‌ساز ریموت TV
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* D-Pad Buttons - Elegant Dark */}
          <div className="flex flex-col items-center gap-1.5 my-2">
            <button
              onClick={() => onNavigate('up')}
              className="flex h-10 w-12 items-center justify-center rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black text-gray-200 border border-gray-700 shadow active:scale-95 transition-all"
              title="Up"
            >
              <ChevronUp className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onNavigate('left')}
                className="flex h-10 w-12 items-center justify-center rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black text-gray-200 border border-gray-700 shadow active:scale-95 transition-all"
                title="Left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={() => onNavigate('select')}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 hover:bg-amber-400 font-black text-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                title="OK / Select"
              >
                OK
              </button>

              <button
                onClick={() => onNavigate('right')}
                className="flex h-10 w-12 items-center justify-center rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black text-gray-200 border border-gray-700 shadow active:scale-95 transition-all"
                title="Right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={() => onNavigate('down')}
              className="flex h-10 w-12 items-center justify-center rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black text-gray-200 border border-gray-700 shadow active:scale-95 transition-all"
              title="Down"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* Bottom Utility buttons */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-gray-800">
            <button
              onClick={() => onNavigate('back')}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-gray-800 hover:bg-gray-700 py-1.5 text-xs text-gray-300 border border-gray-700 transition-colors"
              title="Back"
            >
              <CornerDownLeft className="h-3.5 w-3.5" /> بازگشت
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-gray-800 hover:bg-gray-700 py-1.5 text-xs text-gray-300 border border-gray-700 transition-colors"
              title="Home"
            >
              <Home className="h-3.5 w-3.5" /> خانه
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
