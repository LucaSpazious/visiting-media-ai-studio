'use client';

import { useState } from 'react';

interface PhotoInfo {
  id: string;
  filename: string;
  original_url: string;
  space_id: string;
  vas_spaces: {
    name: string;
    space_type_id: string;
    vas_space_types: { name: string };
  };
}

interface Generation {
  id: string;
  result_url: string | null;
  status: string;
  prompt: string;
  vas_photos: PhotoInfo;
}

export default function GenerationCard({ generation }: { generation: Generation }) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className="bg-luxury-card rounded-xl overflow-hidden border border-gold/10 card-hover">
      <div className="grid grid-cols-2">
        <div className="relative">
          <div className="aspect-video bg-luxury-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={generation.vas_photos?.original_url} alt={generation.vas_photos?.filename || 'Original'} className="w-full h-full object-cover" />
          </div>
          <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium bg-black/60 text-cream px-1.5 py-0.5 rounded">Original</span>
        </div>
        <div className="relative">
          <div className="aspect-video bg-luxury-black">
            {generation.status === 'done' && generation.result_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={generation.result_url} alt={`Generated ${generation.vas_photos?.filename}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium bg-gold text-luxury-black px-1.5 py-0.5 rounded">AI Generated</span>
              </>
            ) : generation.status === 'processing' ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin h-6 w-6 border-2 border-gold border-t-transparent rounded-full" />
                <p className="text-xs text-cream-dark mt-2">Processing...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-red-400 mt-1">Failed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 py-2 border-t border-luxury-border">
        <div className="flex items-center justify-between">
          <p className="text-xs text-cream-dark truncate max-w-[50%]">{generation.vas_photos?.filename}</p>
          <div className="flex items-center gap-3">
            {generation.prompt && (
              <button onClick={() => setShowPrompt(!showPrompt)} className="text-xs text-cream-dark hover:text-cream transition-colors">
                {showPrompt ? 'Hide prompt' : 'Show prompt'}
              </button>
            )}
            {generation.status === 'done' && generation.result_url && (
              <a href={generation.result_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:text-gold-light font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download
              </a>
            )}
          </div>
        </div>
        {showPrompt && generation.prompt && (
          <p className="text-xs text-cream-dark mt-2 leading-relaxed italic">&ldquo;{generation.prompt}&rdquo;</p>
        )}
      </div>
    </div>
  );
}
