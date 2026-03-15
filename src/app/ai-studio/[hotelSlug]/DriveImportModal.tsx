'use client';

import { useState, useEffect, useCallback } from 'react';
import DriveFileGrid from './DriveFileGrid';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  size?: string;
}

interface DriveImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (fileIds: string[]) => Promise<void>;
}

export default function DriveImportModal({ open, onClose, onImport }: DriveImportModalProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const fetchFiles = useCallback(async (pageToken?: string, query?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (pageToken) params.set('pageToken', pageToken);
      if (query) params.set('q', query);

      const res = await fetch(`/api/drive/files?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load files');
        return;
      }

      if (pageToken) {
        setFiles((prev) => [...prev, ...data.files]);
      } else {
        setFiles(data.files);
      }
      setNextPageToken(data.nextPageToken);
    } catch {
      setError('Failed to connect to Google Drive');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setFiles([]);
      setSelectedIds(new Set());
      setSearch('');
      setNextPageToken(null);
      fetchFiles();
    }
  }, [open, fetchFiles]);

  function toggleSelect(fileId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }

  async function handleSearch() {
    setNextPageToken(null);
    await fetchFiles(undefined, search);
  }

  async function handleImport() {
    if (selectedIds.size === 0) return;
    setImporting(true);
    try {
      await onImport(Array.from(selectedIds));
      onClose();
    } catch {
      setError('Import failed');
    } finally {
      setImporting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Import from Google Drive</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-50">
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search images..."
              className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSearch}
              className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Search
            </button>
          </div>
        </div>

        {/* File grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <DriveFileGrid
            files={files}
            selectedIds={selectedIds}
            loading={loading}
            error={error}
            nextPageToken={nextPageToken}
            onToggleSelect={toggleSelect}
            onLoadMore={() => fetchFiles(nextPageToken || undefined, search || undefined)}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
            {files.length > 0 && (
              <button
                onClick={() => setSelectedIds(new Set(files.map((f) => f.id)))}
                className="text-xs text-blue-600 hover:underline"
              >
                Select all
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedIds.size === 0 || importing}
              className="text-sm px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Importing...
                </>
              ) : (
                `Import ${selectedIds.size > 0 ? `(${selectedIds.size})` : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
