'use client';

interface FloatingSelectionBarProps {
  count: number;
  onClear: () => void;
  onEditWithAI: () => void;
}

export default function FloatingSelectionBar({
  count,
  onClear,
  onEditWithAI,
}: FloatingSelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md sm:w-auto">
      <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 bg-luxury-card border border-gold/20 text-cream rounded-2xl shadow-2xl">
        <span className="text-sm font-medium whitespace-nowrap">
          {count} photo{count > 1 ? 's' : ''} selected
        </span>
        <div className="w-px h-5 bg-luxury-border" />
        <button
          onClick={onClear}
          className="text-sm text-cream-dark hover:text-cream transition-colors"
        >
          Clear
        </button>
        <button
          onClick={onEditWithAI}
          className="flex items-center gap-2 px-4 py-1.5 bg-gold hover:bg-gold-light text-luxury-black rounded-xl text-sm font-semibold tracking-wide transition-all"
        >
          <span className="hidden sm:inline">Edit with AI</span>
          <span className="sm:hidden">AI</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
