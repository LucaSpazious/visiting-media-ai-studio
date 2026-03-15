'use client';

import { GenerationResult } from './types';

interface GenerationResultsGridProps {
  results: GenerationResult[];
}

export default function GenerationResultsGrid({ results }: GenerationResultsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {results.map((result) => (
        <GenerationCard key={result.photoId} result={result} />
      ))}
    </div>
  );
}

function GenerationCard({ result }: { result: GenerationResult }) {
  return (
    <div className="bg-luxury-card rounded-xl overflow-hidden border border-luxury-border card-hover">
      <div className="grid grid-cols-2">
        <div className="relative">
          <div className="aspect-video bg-luxury-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.originalUrl} alt={result.filename} className="w-full h-full object-cover" />
          </div>
          <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium bg-black/60 text-cream px-1.5 py-0.5 rounded">
            Original
          </span>
        </div>

        <div className="relative">
          <div className="aspect-video bg-luxury-black">
            {result.status === 'done' && result.resultUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.resultUrl} alt={`Generated ${result.filename}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium bg-gold text-luxury-black px-1.5 py-0.5 rounded">
                  AI Generated
                </span>
              </>
            ) : result.status === 'generating' ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin h-6 w-6 border-2 border-gold border-t-transparent rounded-full" />
                <p className="text-xs text-cream-dark mt-2">Generating...</p>
              </div>
            ) : result.status === 'error' ? (
              <div className="flex flex-col items-center justify-center h-full">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-red-400 mt-1.5 px-2 text-center">{result.error || 'Failed'}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 rounded-full border-2 border-luxury-border" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 py-2 flex items-center justify-between border-t border-luxury-border">
        <p className="text-xs text-cream-dark truncate max-w-[60%]">{result.filename}</p>
        <div className="flex items-center gap-2">
          {result.status === 'done' && result.resultUrl && (
            <a
              href={result.resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gold hover:text-gold-light font-medium flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download
            </a>
          )}
          {result.status === 'generating' && (
            <span className="text-xs text-gold animate-pulse">Processing...</span>
          )}
          {result.status === 'error' && (
            <span className="text-xs text-red-400">Error</span>
          )}
          {result.status === 'pending' && (
            <span className="text-xs text-cream-dark">Queued</span>
          )}
        </div>
      </div>
    </div>
  );
}
