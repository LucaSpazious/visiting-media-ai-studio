'use client';

import { Photo } from './types';

interface PhotoCardProps {
  photo: Photo;
  isSelected: boolean;
  onToggleSelect: (photoId: string) => void;
  onDelete?: (photoId: string) => void;
  showDeleteOnHover?: boolean;
}

export default function PhotoCard({
  photo,
  isSelected,
  onToggleSelect,
  onDelete,
  showDeleteOnHover = false,
}: PhotoCardProps) {
  return (
    <div
      onClick={() => onToggleSelect(photo.id)}
      className={`group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm border-2 transition-all ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-100 hover:border-gray-300'
      }`}
    >
      <div className="aspect-video relative bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.original_url}
          alt={photo.filename}
          className="w-full h-full object-cover"
        />
        {/* Selection checkmark */}
        <div
          className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-blue-600 border-blue-600'
              : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'
          }`}
        >
          {isSelected && (
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        {showDeleteOnHover && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photo.id);
            }}
            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
