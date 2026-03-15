'use client';

import PhotoCard from './PhotoCard';
import { Photo, Person, GenerationResult } from './types';
import { Theme } from '@/lib/themes';
import GenerationResultsGrid from './GenerationResultsGrid';

interface GenerateTabProps {
  photos: Photo[];
  selectedTheme: Theme | null;
  selectedPerson: Person | null;
  selectedPhotoIds: Set<string>;
  generating: boolean;
  generationResults: GenerationResult[];
  error: string;
  onToggleSelect: (photoId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onGenerate: () => void;
  onGoToPhotos: () => void;
}

export default function GenerateTab({
  photos,
  selectedTheme,
  selectedPerson,
  selectedPhotoIds,
  generating,
  generationResults,
  error,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onGenerate,
  onGoToPhotos,
}: GenerateTabProps) {
  const selectedPhotos = photos.filter((p) => selectedPhotoIds.has(p.id));
  const hasResults = generationResults.length > 0;
  const doneCount = generationResults.filter((r) => r.status === 'done').length;
  const totalCount = generationResults.length;
  const canGenerate = selectedPhotoIds.size > 0 && selectedTheme && !generating;

  // If results exist, show results view
  if (hasResults) {
    return (
      <>
        {/* Generation header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedTheme?.emoji} {selectedTheme?.name}
                {selectedPerson && (
                  <span className="text-gray-500 font-normal"> with {selectedPerson.name}</span>
                )}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {generating
                  ? `Generating... ${doneCount}/${totalCount}`
                  : `${doneCount} of ${totalCount} generated successfully`}
              </p>
            </div>
            {!generating && (
              <button
                onClick={onGoToPhotos}
                className="text-sm text-blue-600 hover:underline"
              >
                Back to Photos
              </button>
            )}
          </div>

          {/* Progress bar */}
          {generating && (
            <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
        )}

        <GenerationResultsGrid results={generationResults} />
      </>
    );
  }

  // No photos selected — guide user
  if (selectedPhotoIds.size === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
        <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
        <p className="text-gray-500 text-lg">No photos selected</p>
        <p className="text-gray-400 text-sm mt-2 mb-4">
          Select photos from below, or go to the Photos tab to select and come back.
        </p>
        <button
          onClick={onGoToPhotos}
          className="text-sm text-blue-600 hover:underline"
        >
          Go to Photos tab
        </button>
      </div>
    );
  }

  // Photos selected — show summary + photo grid
  return (
    <>
      {/* Selected photos summary + generate controls */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} ready to generate
            </h2>
            {selectedTheme && (
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedTheme.emoji} {selectedTheme.name}
                {selectedPerson && ` — with ${selectedPerson.name}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!selectedTheme && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                Pick a theme from the sidebar
              </span>
            )}
            <button
              onClick={onGenerate}
              disabled={!canGenerate}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Generate {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''}
            </button>
          </div>
        </div>

        {/* Selected photos thumbnail strip */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {selectedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-gray-100 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.original_url}
                alt={photo.filename}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onToggleSelect(photo.id)}
                className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      {/* All photos grid — for adding/removing selections */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          All photos in scope
          <span className="text-gray-400 font-normal"> ({photos.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={onSelectAll} className="text-xs text-blue-600 hover:underline">
            Select All
          </button>
          <button onClick={onDeselectAll} className="text-xs text-gray-500 hover:underline">
            Deselect All
          </button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">No photos in this scope</p>
          <p className="text-gray-400 text-sm mt-1">Upload photos in the Photos tab first</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isSelected={selectedPhotoIds.has(photo.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </>
  );
}
