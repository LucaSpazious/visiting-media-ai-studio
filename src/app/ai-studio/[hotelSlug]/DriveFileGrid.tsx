'use client';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  size?: string;
}

interface DriveFileGridProps {
  files: DriveFile[];
  selectedIds: Set<string>;
  loading: boolean;
  error: string;
  nextPageToken: string | null;
  onToggleSelect: (fileId: string) => void;
  onLoadMore: () => void;
}

export default function DriveFileGrid({
  files,
  selectedIds,
  loading,
  error,
  nextPageToken,
  onToggleSelect,
  onLoadMore,
}: DriveFileGridProps) {
  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {files.length === 0 && !loading && !error && (
        <div className="text-center py-12 text-gray-400">
          <p>No images found in your Google Drive</p>
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {files.map((file) => (
          <button
            key={file.id}
            onClick={() => onToggleSelect(file.id)}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
              selectedIds.has(file.id)
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-100 hover:border-gray-300'
            }`}
          >
            {file.thumbnailLink ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={file.thumbnailLink.replace('=s220', '=s400')}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              </div>
            )}
            <div
              className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                selectedIds.has(file.id)
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white/80 border-gray-300'
              }`}
            >
              {selectedIds.has(file.id) && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
              <p className="text-[10px] text-white truncate">{file.name}</p>
            </div>
          </button>
        ))}
      </div>

      {nextPageToken && (
        <div className="text-center mt-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="text-sm text-blue-600 hover:underline"
          >
            Load more
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}
    </>
  );
}
