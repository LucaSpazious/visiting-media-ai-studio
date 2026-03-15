'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { THEMES, Theme } from '@/lib/themes';
import { Hotel, Photo, Person, ScopeLevel, ActiveTab, GenerationResult } from './types';
import PhotosTab from './PhotosTab';
import GenerateTab from './GenerateTab';
import FloatingSelectionBar from './FloatingSelectionBar';
import DriveImportModal from './DriveImportModal';
import { useToast } from '@/components/Toast';

export default function AIStudioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const hotelSlug = params.hotelSlug as string;
  const { toast } = useToast();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    searchParams.get('tab') === 'generate' ? 'generate' : 'photos'
  );

  // Scope selection state
  const [scopeLevel, setScopeLevel] = useState<ScopeLevel>('hotel');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');

  // Space/type management
  const [addingType, setAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [addingSpaceForType, setAddingSpaceForType] = useState<string | null>(null);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Photo upload
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Drive import
  const [driveModalOpen, setDriveModalOpen] = useState(false);

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Theme + person + selection state (Generate tab)
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<GenerationResult[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchPhotos = useCallback(async (hotelId: string, spaceTypeId?: string, spaceId?: string) => {
    setLoadingPhotos(true);
    const p = new URLSearchParams({ hotelId });
    if (spaceId) p.set('spaceId', spaceId);
    else if (spaceTypeId) p.set('spaceTypeId', spaceTypeId);

    try {
      const res = await fetch(`/api/photos?${p}`);
      if (res.ok) {
        setPhotos(await res.json());
      }
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  const refreshHotel = useCallback(async () => {
    const res = await fetch(`/api/hotels/${hotelSlug}`);
    if (res.ok) {
      const data = await res.json();
      setHotel(data);
      return data;
    }
    return null;
  }, [hotelSlug]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const data = await refreshHotel();
        if (data) {
          fetchPhotos(data.id);
          const peopleRes = await fetch(`/api/people?hotelId=${data.id}`);
          if (peopleRes.ok) setPeople(await peopleRes.json());
        }
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchAll();
  }, [status, refreshHotel, fetchPhotos]);

  useEffect(() => {
    if (!hotel) return;
    if (scopeLevel === 'hotel') fetchPhotos(hotel.id);
    else if (scopeLevel === 'type' && selectedTypeId) fetchPhotos(hotel.id, selectedTypeId);
    else if (scopeLevel === 'space' && selectedSpaceId) fetchPhotos(hotel.id, undefined, selectedSpaceId);
  }, [scopeLevel, selectedTypeId, selectedSpaceId, hotel, fetchPhotos]);

  // Clear selection when scope changes
  useEffect(() => {
    setSelectedPhotoIds(new Set());
  }, [scopeLevel, selectedTypeId, selectedSpaceId]);

  // ---- Space Type CRUD ----
  async function handleAddType() {
    if (!hotel || !newTypeName.trim()) return;
    const res = await fetch('/api/space-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelId: hotel.id, name: newTypeName.trim() }),
    });
    if (res.ok) {
      await refreshHotel();
      setNewTypeName('');
      setAddingType(false);
    }
  }

  async function handleRenameType(typeId: string) {
    if (!editName.trim()) { setEditingTypeId(null); return; }
    await fetch(`/api/space-types/${typeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    });
    await refreshHotel();
    setEditingTypeId(null);
  }

  async function handleDeleteType(typeId: string) {
    if (!confirm('Delete this space type and all its spaces?')) return;
    await fetch(`/api/space-types/${typeId}`, { method: 'DELETE' });
    await refreshHotel();
    if (selectedTypeId === typeId) {
      setScopeLevel('hotel');
      setSelectedTypeId('');
      setSelectedSpaceId('');
    }
  }

  // ---- Space CRUD ----
  async function handleAddSpace(typeId: string) {
    if (!hotel || !newSpaceName.trim()) return;
    const res = await fetch('/api/spaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelId: hotel.id, spaceTypeId: typeId, name: newSpaceName.trim() }),
    });
    if (res.ok) {
      await refreshHotel();
      setNewSpaceName('');
      setAddingSpaceForType(null);
    }
  }

  async function handleRenameSpace(spaceId: string) {
    if (!editName.trim()) { setEditingSpaceId(null); return; }
    await fetch(`/api/spaces/${spaceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    });
    await refreshHotel();
    setEditingSpaceId(null);
  }

  async function handleDeleteSpace(spaceId: string) {
    if (!confirm('Delete this space and all its photos?')) return;
    await fetch(`/api/spaces/${spaceId}`, { method: 'DELETE' });
    await refreshHotel();
    if (selectedSpaceId === spaceId) {
      setScopeLevel('type');
      setSelectedSpaceId('');
    }
  }

  // ---- Photo Upload ----
  async function uploadFiles(files: FileList | File[]) {
    if (!hotel || !selectedSpaceId) {
      alert('Select a space first to upload photos');
      return;
    }
    const spaceType = hotel.space_types.find((st) => st.vas_spaces.some((s) => s.id === selectedSpaceId));
    if (!spaceType) return;

    const fileArray = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    );
    if (fileArray.length === 0) return;

    setUploading(true);
    setUploadProgress({ done: 0, total: fileArray.length });

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('hotelId', hotel.id);
        formData.append('spaceId', selectedSpaceId);

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) continue;
        const { url, filename } = await uploadRes.json();

        await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotelId: hotel.id,
            spaceId: selectedSpaceId,
            spaceTypeId: spaceType.id,
            originalUrl: url,
            filename,
          }),
        });
      } catch {
        // skip failed uploads silently
      }
      setUploadProgress({ done: i + 1, total: fileArray.length });
    }

    await fetchPhotos(hotel.id, undefined, selectedSpaceId);
    setUploading(false);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast(`${fileArray.length} photo${fileArray.length > 1 ? 's' : ''} uploaded`, 'success');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  // ---- Photo Delete ----
  async function handleDeletePhoto(photoId: string) {
    if (!confirm('Delete this photo?')) return;
    const res = await fetch(`/api/photos?id=${photoId}`, { method: 'DELETE' });
    if (!res.ok) {
      toast('Failed to delete photo', 'error');
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    toast('Photo deleted', 'success');
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      next.delete(photoId);
      return next;
    });
  }

  // ---- Photo Selection ----
  function togglePhotoSelection(photoId: string) {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  function selectAllPhotos() {
    setSelectedPhotoIds(new Set(photos.map((p) => p.id)));
  }

  function deselectAllPhotos() {
    setSelectedPhotoIds(new Set());
  }

  // ---- Folder Upload (File System Access API) ----
  async function handleFolderUpload() {
    if (!hotel) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dirHandle = await (window as any).showDirectoryPicker();
      const structure: { spaceName: string; files: File[] }[] = [];

      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'directory') {
          const spaceFiles: File[] = [];
          for await (const fileEntry of entry.values()) {
            if (fileEntry.kind === 'file') {
              const file = await fileEntry.getFile();
              if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                spaceFiles.push(file);
              }
            }
          }
          if (spaceFiles.length > 0) {
            structure.push({ spaceName: entry.name, files: spaceFiles });
          }
        }
      }

      if (structure.length === 0) {
        alert('No image subfolders found');
        return;
      }

      setUploading(true);
      const totalFiles = structure.reduce((sum, s) => sum + s.files.length, 0);
      setUploadProgress({ done: 0, total: totalFiles });
      let done = 0;

      // Get or create a default space type
      let defaultType = hotel.space_types[0];
      if (!defaultType) {
        const typeRes = await fetch('/api/space-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hotelId: hotel.id, name: 'Imported' }),
        });
        if (typeRes.ok) {
          await refreshHotel();
          const updatedHotel = await refreshHotel();
          if (updatedHotel) defaultType = updatedHotel.space_types[0];
        }
      }

      if (!defaultType) {
        setUploading(false);
        setUploadProgress(null);
        return;
      }

      for (const { spaceName, files } of structure) {
        // Create space
        const spaceRes = await fetch('/api/spaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hotelId: hotel.id, spaceTypeId: defaultType.id, name: spaceName }),
        });
        if (!spaceRes.ok) continue;
        const newSpace = await spaceRes.json();

        for (const file of files) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('hotelId', hotel.id);
            formData.append('spaceId', newSpace.id);

            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!uploadRes.ok) continue;
            const { url, filename } = await uploadRes.json();

            await fetch('/api/photos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                hotelId: hotel.id,
                spaceId: newSpace.id,
                spaceTypeId: defaultType.id,
                originalUrl: url,
                filename,
              }),
            });
          } catch { /* skip */ }
          done++;
          setUploadProgress({ done, total: totalFiles });
        }
      }

      await refreshHotel();
      if (hotel) fetchPhotos(hotel.id);
      setUploading(false);
      setUploadProgress(null);
    } catch {
      // User cancelled or API not supported
      setUploading(false);
      setUploadProgress(null);
    }
  }

  // ---- Google Drive Import ----
  function handleDriveImport() {
    if (!hotel || !session) return;
    if (!selectedSpaceId) {
      toast('Select a space first to import photos', 'info');
      return;
    }
    setDriveModalOpen(true);
  }

  async function handleDriveImportFiles(fileIds: string[]) {
    if (!hotel || !selectedSpaceId) return;
    const spaceType = hotel.space_types.find((st) =>
      st.vas_spaces.some((s) => s.id === selectedSpaceId)
    );
    if (!spaceType) return;

    const res = await fetch('/api/drive/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileIds,
        hotelId: hotel.id,
        spaceId: selectedSpaceId,
        spaceTypeId: spaceType.id,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast(data.error || 'Import failed', 'error');
      return;
    }

    toast(`${data.successCount} of ${data.total} photos imported`, data.successCount > 0 ? 'success' : 'error');
    await fetchPhotos(hotel.id, undefined, selectedSpaceId);
  }

  // ---- Batch Generation ----
  async function handleBatchGenerate() {
    if (!selectedTheme || !hotel || selectedPhotoIds.size === 0) return;
    setGenerating(true);
    setError('');

    const selectedPhotos = photos.filter((p) => selectedPhotoIds.has(p.id));

    // Initialize per-photo tracking
    const initialResults: GenerationResult[] = selectedPhotos.map((p) => ({
      photoId: p.id,
      originalUrl: p.original_url,
      filename: p.filename,
      status: 'pending' as const,
    }));
    setGenerationResults(initialResults);

    // Build project name
    const scopeName = scopeLevel === 'hotel'
      ? hotel.name
      : scopeLevel === 'type'
        ? hotel.space_types.find((st) => st.id === selectedTypeId)?.name || ''
        : hotel.space_types.flatMap((st) => st.vas_spaces).find((s) => s.id === selectedSpaceId)?.name || '';
    const personPart = selectedPerson ? ` — ${selectedPerson.name}` : '';
    const projectName = `${scopeName}${personPart} — ${selectedTheme.name}`;

    try {
      // Create project
      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: hotel.id,
          name: projectName,
          theme: selectedTheme.id,
          personId: selectedPerson?.id,
          scopeType: scopeLevel,
          scopeId: scopeLevel === 'hotel' ? hotel.id : scopeLevel === 'type' ? selectedTypeId : selectedSpaceId,
        }),
      });
      if (!projRes.ok) throw new Error('Failed to create project');
      const project = await projRes.json();

      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];

        // Mark current photo as generating
        setGenerationResults((prev) =>
          prev.map((r) => r.photoId === photo.id ? { ...r, status: 'generating' as const } : r)
        );

        try {
          const spaceType = hotel.space_types.find((st) =>
            st.vas_spaces.some((s) => s.id === photo.space_id)
          );
          const space = spaceType?.vas_spaces.find((s) => s.id === photo.space_id);

          // Generate prompt via Claude
          const promptRes = await fetch('/api/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              themeId: selectedTheme.id,
              spaceName: space?.name,
              spaceType: spaceType?.name,
              personName: selectedPerson?.name,
            }),
          });
          if (!promptRes.ok) throw new Error('Prompt generation failed');
          const { prompt } = await promptRes.json();

          // Generate image via FLUX.1 Kontext [max]
          const genRes = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photoId: photo.id,
              hotelId: hotel.id,
              theme: selectedTheme.id,
              prompt,
              imageUrl: photo.original_url,
              personId: selectedPerson?.id,
              personImageUrl: selectedPerson?.image_url,
              projectId: project.id,
            }),
          });

          const genData = await genRes.json();
          if (genRes.ok && genData.result_url) {
            setGenerationResults((prev) =>
              prev.map((r) => r.photoId === photo.id
                ? { ...r, status: 'done' as const, resultUrl: genData.result_url, prompt }
                : r
              )
            );
          } else {
            throw new Error(genData.error || 'Generation failed');
          }
        } catch (err) {
          setGenerationResults((prev) =>
            prev.map((r) => r.photoId === photo.id
              ? { ...r, status: 'error' as const, error: err instanceof Error ? err.message : 'Failed' }
              : r
            )
          );
        }
      }

      // Update project status
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });

      // Toast with results summary — count actual successes from latest state
      setGenerationResults((prev) => {
        const successCount = prev.filter((r) => r.status === 'done').length;
        const failCount = prev.filter((r) => r.status === 'error').length;
        if (failCount > 0) {
          toast(`${successCount} generated, ${failCount} failed`, failCount === prev.length ? 'error' : 'info');
        } else {
          toast(`${successCount} photo${successCount > 1 ? 's' : ''} generated successfully`, 'success');
        }
        return prev;
      });
    } catch {
      setError('Generation failed. Could not create project.');
      toast('Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-black">
        <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-black">
        <p className="text-cream-dark">Hotel not found</p>
      </div>
    );
  }

  const canManage = session?.user.role !== 'hotel_user';

  return (
    <div className="min-h-screen bg-luxury-black">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-luxury-surface via-luxury-card to-luxury-surface border-b border-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              {/* Mobile hamburger */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-1.5 text-cream-dark hover:text-cream"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>
              <Link href="/dashboard" className="text-cream-dark hover:text-cream hidden sm:block">
                &larr;
              </Link>
              <h1 className="text-xl font-display font-bold text-cream">{hotel.name}</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('photos')}
                className={`text-sm px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTab === 'photos' ? 'font-medium text-gold bg-gold/10' : 'text-cream-dark hover:text-cream'}`}
              >
                Photos
              </button>
              <button
                onClick={() => setActiveTab('generate')}
                className={`text-sm px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTab === 'generate' ? 'font-medium text-gold bg-gold/10' : 'text-cream-dark hover:text-cream'}`}
              >
                Generate
              </button>
              <Link href={`/ai-studio/${hotelSlug}/projects`} className="text-sm text-cream-dark hover:text-cream px-3 py-2 whitespace-nowrap">
                Projects
              </Link>
              <Link href={`/ai-studio/${hotelSlug}/people`} className="text-sm text-gold bg-gold/10 px-3 py-2 rounded-lg hover:bg-gold/20 transition-colors whitespace-nowrap hidden sm:block">
                People Bank
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Left sidebar — scope */}
          <div className={`lg:col-span-1 space-y-6 ${sidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-72 bg-luxury-black p-4 pt-20 overflow-y-auto border-r border-gold/10 lg:static lg:w-auto lg:p-0 lg:pt-0 lg:border-0' : 'hidden lg:block'}`}>
            <div className="bg-luxury-card rounded-xl p-5 border border-gold/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-cream">Spaces</h3>
                <div className="flex gap-1">
                  <button
                    onClick={handleFolderUpload}
                    className="text-xs text-cream-dark hover:text-gold px-2 py-1 rounded hover:bg-gold/5 transition-colors"
                    title="Upload folder"
                  >
                    Folder
                  </button>
                  <button
                    onClick={handleDriveImport}
                    className="text-xs text-cream-dark hover:text-gold px-2 py-1 rounded hover:bg-gold/5 transition-colors"
                    title="Import from Google Drive"
                  >
                    Drive
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => { setScopeLevel('hotel'); setSelectedTypeId(''); setSelectedSpaceId(''); setSidebarOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${scopeLevel === 'hotel' ? 'bg-gold/10 text-gold font-medium' : 'hover:bg-luxury-hover text-cream-muted'}`}
                >
                  Entire Hotel
                </button>

                {hotel.space_types.map((st) => (
                  <div key={st.id}>
                    <div className="group flex items-center">
                      {editingTypeId === st.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => handleRenameType(st.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRenameType(st.id); if (e.key === 'Escape') setEditingTypeId(null); }}
                          className="flex-1 px-3 py-1.5 text-sm border-b border-gold outline-none bg-transparent text-cream"
                        />
                      ) : (
                        <button
                          onClick={() => { setScopeLevel('type'); setSelectedTypeId(st.id); setSelectedSpaceId(''); setSidebarOpen(false); }}
                          className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors ${scopeLevel === 'type' && selectedTypeId === st.id ? 'bg-gold/10 text-gold font-medium' : 'hover:bg-luxury-hover text-cream-muted'}`}
                        >
                          {st.name}
                          <span className="text-xs text-cream-dark ml-1">({st.vas_spaces.length})</span>
                        </button>
                      )}
                      {canManage && editingTypeId !== st.id && (
                        <div className="hidden group-hover:flex items-center gap-0.5 mr-1">
                          <button
                            onClick={() => { setEditingTypeId(st.id); setEditName(st.name); }}
                            className="p-1 text-cream-dark hover:text-gold rounded"
                            title="Rename"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDeleteType(st.id)}
                            className="p-1 text-cream-dark hover:text-red-400 rounded"
                            title="Delete"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {(selectedTypeId === st.id || selectedSpaceId) && (
                      <div className="ml-4 mt-1 space-y-0.5">
                        {st.vas_spaces.map((s) => (
                          <div key={s.id} className="group/space flex items-center">
                            {editingSpaceId === s.id ? (
                              <input
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={() => handleRenameSpace(s.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSpace(s.id); if (e.key === 'Escape') setEditingSpaceId(null); }}
                                className="flex-1 px-3 py-1 text-xs border-b border-gold outline-none bg-transparent text-cream"
                              />
                            ) : (
                              <button
                                onClick={() => { setScopeLevel('space'); setSelectedTypeId(st.id); setSelectedSpaceId(s.id); setSidebarOpen(false); }}
                                className={`flex-1 text-left px-3 py-1.5 rounded text-xs transition-colors ${scopeLevel === 'space' && selectedSpaceId === s.id ? 'bg-gold/10 text-gold font-medium' : 'hover:bg-luxury-hover text-cream-dark'}`}
                              >
                                {s.name}
                              </button>
                            )}
                            {canManage && editingSpaceId !== s.id && (
                              <div className="hidden group-hover/space:flex items-center gap-0.5 mr-1">
                                <button
                                  onClick={() => { setEditingSpaceId(s.id); setEditName(s.name); }}
                                  className="p-0.5 text-cream-dark hover:text-gold rounded"
                                >
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteSpace(s.id)}
                                  className="p-0.5 text-cream-dark hover:text-red-400 rounded"
                                >
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {canManage && selectedTypeId === st.id && (
                          <>
                            {addingSpaceForType === st.id ? (
                              <div className="flex items-center gap-1 ml-3">
                                <input
                                  autoFocus
                                  value={newSpaceName}
                                  onChange={(e) => setNewSpaceName(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddSpace(st.id); if (e.key === 'Escape') setAddingSpaceForType(null); }}
                                  placeholder="Space name"
                                  className="flex-1 text-xs px-2 py-1 border border-luxury-border rounded outline-none bg-transparent text-cream"
                                />
                                <button onClick={() => handleAddSpace(st.id)} className="text-xs text-gold hover:text-gold-light px-1">Add</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setAddingSpaceForType(st.id); setNewSpaceName(''); }}
                                className="text-xs text-cream-dark hover:text-gold px-3 py-1"
                              >
                                + Add space
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {canManage && (
                  <>
                    {addingType ? (
                      <div className="flex items-center gap-1 mt-2">
                        <input
                          autoFocus
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddType(); if (e.key === 'Escape') setAddingType(false); }}
                          placeholder="Type name"
                          className="flex-1 text-sm px-3 py-1.5 border border-luxury-border rounded-lg outline-none bg-transparent text-cream"
                        />
                        <button onClick={handleAddType} className="text-sm text-gold hover:text-gold-light px-2">Add</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingType(true); setNewTypeName(''); }}
                        className="w-full text-left px-3 py-2 text-sm text-cream-dark hover:text-gold hover:bg-luxury-hover rounded-lg transition-colors"
                      >
                        + Add space type
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Generate tab sidebar: theme + person */}
            {activeTab === 'generate' && (
              <>
                <div className="bg-luxury-card rounded-xl p-5 border border-gold/10">
                  <h3 className="font-display font-semibold text-cream mb-3">Theme</h3>
                  <div className="space-y-1.5">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${selectedTheme?.id === theme.id ? 'bg-gold/10 text-gold font-medium ring-1 ring-gold/20' : 'hover:bg-luxury-hover text-cream-muted'}`}
                      >
                        <span>{theme.emoji}</span>
                        <span>{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-luxury-card rounded-xl p-5 border border-gold/10">
                  <h3 className="font-display font-semibold text-cream mb-3">Person (optional)</h3>
                  <button
                    onClick={() => setSelectedPerson(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${!selectedPerson ? 'bg-luxury-hover text-cream font-medium' : 'hover:bg-luxury-hover text-cream-dark'}`}
                  >
                    No person
                  </button>
                  {people.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => setSelectedPerson(person)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${selectedPerson?.id === person.id ? 'bg-gold/10 text-gold font-medium' : 'hover:bg-luxury-hover text-cream-muted'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={person.image_url} alt={person.name} className="w-6 h-6 rounded-full object-cover border border-gold/20" />
                      {person.name}
                    </button>
                  ))}
                  {people.length === 0 && (
                    <p className="text-xs text-cream-dark">
                      <Link href={`/ai-studio/${hotelSlug}/people`} className="text-gold hover:text-gold-light">Add people</Link>
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {activeTab === 'photos' ? (
              <PhotosTab
                hotel={hotel}
                photos={photos}
                loadingPhotos={loadingPhotos}
                scopeLevel={scopeLevel}
                selectedTypeId={selectedTypeId}
                selectedSpaceId={selectedSpaceId}
                selectedPhotoIds={selectedPhotoIds}
                canManage={canManage}
                uploading={uploading}
                uploadProgress={uploadProgress}
                dragOver={dragOver}
                onDragOver={() => setDragOver(true)}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onUploadFiles={uploadFiles}
                onDeletePhoto={handleDeletePhoto}
                onToggleSelect={togglePhotoSelection}
                onSelectAll={selectAllPhotos}
                onDeselectAll={deselectAllPhotos}
              />
            ) : (
              <GenerateTab
                photos={photos}
                selectedTheme={selectedTheme}
                selectedPerson={selectedPerson}
                selectedPhotoIds={selectedPhotoIds}
                generating={generating}
                generationResults={generationResults}
                error={error}
                onToggleSelect={togglePhotoSelection}
                onSelectAll={selectAllPhotos}
                onDeselectAll={deselectAllPhotos}
                onGenerate={handleBatchGenerate}
                onGoToPhotos={() => setActiveTab('photos')}
              />
            )}
          </div>
        </div>
      </main>

      {/* Floating selection bar — visible in Photos tab when photos are selected */}
      {activeTab === 'photos' && (
        <FloatingSelectionBar
          count={selectedPhotoIds.size}
          onClear={deselectAllPhotos}
          onEditWithAI={() => setActiveTab('generate')}
        />
      )}

      {/* Drive import modal */}
      <DriveImportModal
        open={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        onImport={handleDriveImportFiles}
      />
    </div>
  );
}
