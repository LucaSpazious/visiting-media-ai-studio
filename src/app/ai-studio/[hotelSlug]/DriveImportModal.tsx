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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-luxury-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4 border border-gold/10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-luxury-border">
          <h2 className="text-lg font-display font-semibold text-cream">Import from Google Drive</h2>
          <button onClick={onClose} className="text-cream-dark hover:text-cream transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-3 border-b border-luxury-border">
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search images..."
              className="flex-1 text-sm px-3 py-2 bg-luxury-black border border-luxury-border rounded-lg text-cream placeholder-cream-dark"
            />
            <button
              onClick={handleSearch}
              className="text-sm px-4 py-2 bg-luxury-hover text-cream rounded-lg hover:bg-luxury-border transition-colors"
            >
              Search
            </button>
          </div>
        </div>

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

        <div className="flex items-center justify-between px-6 py-4 border-t border-luxury-border">
          <div className="flex items-center gap-3">
            <span className="text-sm text-cream-dark">{selectedIds.size} selected</span>
            {files.length > 0 && (
              <button
                onClick={() => setSelectedIds(new Set(files.map((f) => f.id)))}
                className="text-xs text-gold hover:text-gold-light"
              >
                Select all
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm px-4 py-2 text-cream-dark hover:text-cream transition-colors">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedIds.size === 0 || importing}
              className="text-sm px-5 py-2 bg-gold text-luxury-black rounded-lg font-semibold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              {importing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-luxury-black border-t-transparent rounded-full" />
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
