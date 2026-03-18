import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';

interface ImageTypeIndicatorProps {
  type: 'generated' | 'placeholder' | 'fallback';
  niche?: string;
}

export default function ImageTypeIndicator({ type, niche }: ImageTypeIndicatorProps) {
  if (type === 'generated') {
    return (
      <div className="absolute top-2 right-2 bg-green-600/90 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 font-semibold shadow-lg">
        <Sparkles size={14} />
        Gerada por IA
      </div>
    );
  }

  if (type === 'placeholder') {
    return (
      <div className="absolute top-2 right-2 bg-yellow-600/90 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 font-semibold shadow-lg">
        <AlertTriangle size={14} />
        Placeholder {niche && `(${niche})`}
      </div>
    );
  }

  return (
    <div className="absolute top-2 right-2 bg-gray-600/90 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 font-semibold shadow-lg">
      <AlertTriangle size={14} />
      Fallback
    </div>
  );
}
