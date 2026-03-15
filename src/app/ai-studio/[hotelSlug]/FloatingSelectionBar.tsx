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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 px-6 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl">
        <span className="text-sm font-medium">
          {count} photo{count > 1 ? 's' : ''} selected
        </span>
        <div className="w-px h-5 bg-gray-600" />
        <button
          onClick={onClear}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Clear
        </button>
        <button
          onClick={onEditWithAI}
          className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition-colors"
        >
          Edit with AI
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
