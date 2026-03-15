'use client';

import { useRef } from 'react';
import PhotoCard from './PhotoCard';
import { Hotel, Photo, SpaceType } from './types';

interface PhotosTabProps {
  hotel: Hotel;
  photos: Photo[];
  scopeLevel: 'hotel' | 'type' | 'space';
  selectedTypeId: string;
  selectedSpaceId: string;
  selectedPhotoIds: Set<string>;
  canManage: boolean;
  uploading: boolean;
  uploadProgress: { done: number; total: number } | null;
  dragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onDeletePhoto: (photoId: string) => void;
  onToggleSelect: (photoId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export default function PhotosTab({
  hotel,
  photos,
  scopeLevel,
  selectedTypeId,
  selectedSpaceId,
  selectedPhotoIds,
  canManage,
  uploading,
  uploadProgress,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onUploadFiles,
  onDeletePhoto,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
}: PhotosTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedType: SpaceType | undefined = hotel.space_types.find(
    (st) => st.id === selectedTypeId
  );

  const scopeName =
    scopeLevel === 'hotel'
      ? hotel.name
      : scopeLevel === 'type'
        ? selectedType?.name
        : hotel.space_types
            .flatMap((st) => st.vas_spaces)
            .find((s) => s.id === selectedSpaceId)?.name;

  return (
    <>
      {/* Upload area — only when a space is selected */}
      {scopeLevel === 'space' && selectedSpaceId && (
        <div
          className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            onDragOver();
          }}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {uploading && uploadProgress ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Uploading... {uploadProgress.done}/{uploadProgress.total}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(uploadProgress.done / uploadProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              <svg
                className="w-10 h-10 mx-auto text-gray-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                />
              </svg>
              <p className="text-sm text-gray-500">
                Drag & drop photos here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:underline font-medium"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, WebP accepted
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && onUploadFiles(e.target.files)}
              />
            </>
          )}
        </div>
      )}

      {/* Photo count header + selection controls */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {scopeName}{' '}
          <span className="text-gray-400 font-normal text-sm">
            ({photos.length} photo{photos.length !== 1 ? 's' : ''})
            {selectedPhotoIds.size > 0 &&
              ` — ${selectedPhotoIds.size} selected`}
          </span>
        </h2>
        {photos.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="text-xs text-blue-600 hover:underline"
            >
              Select All
            </button>
            {selectedPhotoIds.size > 0 && (
              <button
                onClick={onDeselectAll}
                className="text-xs text-gray-500 hover:underline"
              >
                Deselect All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Photo grid or empty state */}
      {photos.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <svg
            className="w-16 h-16 mx-auto text-gray-200 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <p className="text-gray-500">No photos yet</p>
          <p className="text-gray-400 text-sm mt-1">
            {scopeLevel === 'space'
              ? 'Drag & drop photos above to upload'
              : 'Select a space to upload photos'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isSelected={selectedPhotoIds.has(photo.id)}
              onToggleSelect={onToggleSelect}
              onDelete={canManage ? onDeletePhoto : undefined}
              showDeleteOnHover={canManage}
            />
          ))}
        </div>
      )}
    </>
  );
}
