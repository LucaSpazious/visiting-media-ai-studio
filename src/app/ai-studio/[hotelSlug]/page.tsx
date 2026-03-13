'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { THEMES, Theme } from '@/lib/themes';

interface Space {
  id: string;
  name: string;
}

interface SpaceType {
  id: string;
  name: string;
  vas_spaces: Space[];
}

interface Hotel {
  id: string;
  name: string;
  slug: string;
  space_types: SpaceType[];
}

interface Photo {
  id: string;
  original_url: string;
  filename: string;
  space_id: string;
  space_type_id: string;
}

interface Person {
  id: string;
  name: string;
  image_url: string;
}

type ScopeLevel = 'hotel' | 'type' | 'space' | 'photo';

export default function AIStudioPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const hotelSlug = params.hotelSlug as string;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // Scope selection state
  const [scopeLevel, setScopeLevel] = useState<ScopeLevel>('hotel');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>('');

  // Theme + person state
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchPhotos = useCallback(async (hotelId: string, spaceTypeId?: string, spaceId?: string) => {
    const params = new URLSearchParams({ hotelId });
    if (spaceId) params.set('spaceId', spaceId);
    else if (spaceTypeId) params.set('spaceTypeId', spaceTypeId);

    const res = await fetch(`/api/photos?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPhotos(data);
    }
  }, []);

  useEffect(() => {
    async function fetchHotel() {
      try {
        const res = await fetch(`/api/hotels/${hotelSlug}`);
        if (res.ok) {
          const data = await res.json();
          setHotel(data);
          fetchPhotos(data.id);

          const peopleRes = await fetch(`/api/people?hotelId=${data.id}`);
          if (peopleRes.ok) {
            setPeople(await peopleRes.json());
          }
        }
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchHotel();
  }, [status, hotelSlug, fetchPhotos]);

  useEffect(() => {
    if (!hotel) return;
    if (scopeLevel === 'hotel') {
      fetchPhotos(hotel.id);
    } else if (scopeLevel === 'type' && selectedTypeId) {
      fetchPhotos(hotel.id, selectedTypeId);
    } else if (scopeLevel === 'space' && selectedSpaceId) {
      fetchPhotos(hotel.id, undefined, selectedSpaceId);
    }
  }, [scopeLevel, selectedTypeId, selectedSpaceId, hotel, fetchPhotos]);

  async function handleGenerate(photoId: string, photoUrl: string) {
    if (!selectedTheme || !hotel) return;
    setGenerating(true);
    setError('');
    setGeneratedUrl('');

    try {
      // Get space info for this photo
      const photo = photos.find((p) => p.id === photoId);
      const spaceType = hotel.space_types.find((st) =>
        st.vas_spaces.some((s) => s.id === photo?.space_id)
      );
      const space = spaceType?.vas_spaces.find((s) => s.id === photo?.space_id);

      // Generate prompt with Claude
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
      const { prompt } = await promptRes.json();
      setGeneratedPrompt(prompt);

      // Generate image with FLUX
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId,
          hotelId: hotel.id,
          theme: selectedTheme.id,
          prompt,
          imageUrl: photoUrl,
          personImageUrl: selectedPerson?.image_url,
        }),
      });

      const genData = await genRes.json();
      if (genRes.ok) {
        setGeneratedUrl(genData.result_url);
      } else {
        setError(genData.error || 'Generation failed');
      }
    } catch {
      setError('Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Hotel not found</p>
      </div>
    );
  }

  const selectedType = hotel.space_types.find((st) => st.id === selectedTypeId);
  const filteredPhotos =
    scopeLevel === 'photo' && selectedPhotoId
      ? photos.filter((p) => p.id === selectedPhotoId)
      : photos;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">
                &larr; Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">{hotel.name}</h1>
            </div>
            <Link
              href={`/ai-studio/${hotelSlug}/people`}
              className="text-sm bg-purple-50 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors"
            >
              People Bank
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left sidebar — scope + theme */}
          <div className="lg:col-span-1 space-y-6">
            {/* Scope Selector */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Scope</h3>
              <div className="space-y-2">
                <button
                  onClick={() => { setScopeLevel('hotel'); setSelectedTypeId(''); setSelectedSpaceId(''); setSelectedPhotoId(''); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${scopeLevel === 'hotel' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                  Entire Hotel
                </button>
                {hotel.space_types.map((st) => (
                  <div key={st.id}>
                    <button
                      onClick={() => { setScopeLevel('type'); setSelectedTypeId(st.id); setSelectedSpaceId(''); setSelectedPhotoId(''); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${scopeLevel === 'type' && selectedTypeId === st.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}
                    >
                      {st.name}
                    </button>
                    {selectedTypeId === st.id && st.vas_spaces.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {st.vas_spaces.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => { setScopeLevel('space'); setSelectedSpaceId(s.id); setSelectedPhotoId(''); }}
                            className={`w-full text-left px-3 py-1.5 rounded text-xs ${scopeLevel === 'space' && selectedSpaceId === s.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-500'}`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Theme Selector */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Theme</h3>
              <div className="space-y-2">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 ${selectedTheme?.id === theme.id ? 'bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-200' : 'hover:bg-gray-50 text-gray-600'}`}
                  >
                    <span className="text-lg">{theme.emoji}</span>
                    <div>
                      <div>{theme.name}</div>
                      <div className="text-xs text-gray-400">{theme.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Person Selector */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Person (optional)</h3>
              <button
                onClick={() => setSelectedPerson(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-2 ${!selectedPerson ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 text-gray-500'}`}
              >
                No person
              </button>
              {people.map((person) => (
                <button
                  key={person.id}
                  onClick={() => setSelectedPerson(person)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${selectedPerson?.id === person.id ? 'bg-purple-50 text-purple-700 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={person.image_url}
                    alt={person.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  {person.name}
                </button>
              ))}
              {people.length === 0 && (
                <p className="text-xs text-gray-400">
                  No people yet.{' '}
                  <Link href={`/ai-studio/${hotelSlug}/people`} className="text-purple-600 hover:underline">
                    Add people
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Main content — photos grid */}
          <div className="lg:col-span-3">
            {!selectedTheme ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                <p className="text-gray-500 text-lg">Select a theme to start generating</p>
                <p className="text-gray-400 text-sm mt-2">Choose a scope and theme from the sidebar</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedTheme.emoji} {selectedTheme.name} — {
                        scopeLevel === 'hotel'
                          ? hotel.name
                          : scopeLevel === 'type'
                            ? selectedType?.name
                            : scopeLevel === 'space'
                              ? selectedType?.vas_spaces.find((s) => s.id === selectedSpaceId)?.name
                              : 'Selected photo'
                      }
                    </h2>
                    <p className="text-sm text-gray-500">{filteredPhotos.length} photo(s)</p>
                  </div>
                </div>

                {filteredPhotos.length === 0 ? (
                  <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                    <p className="text-gray-500">No photos in this scope</p>
                    <p className="text-gray-400 text-sm mt-1">Upload photos to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
                      >
                        <div className="aspect-video relative bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.original_url}
                            alt={photo.filename}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <p className="text-sm font-medium text-gray-700 truncate">{photo.filename}</p>
                          <button
                            onClick={() => handleGenerate(photo.id, photo.original_url)}
                            disabled={generating}
                            className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                          >
                            {generating ? 'Generating...' : `Generate ${selectedTheme.name}`}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Generation result */}
                {(generatedUrl || error) && (
                  <div className="mt-8 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Generation Result</h3>
                      {generatedPrompt && (
                        <p className="text-xs text-gray-400 mt-1">{generatedPrompt}</p>
                      )}
                    </div>
                    {error ? (
                      <div className="p-8 text-center">
                        <p className="text-red-600">{error}</p>
                      </div>
                    ) : (
                      <div className="aspect-video relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={generatedUrl}
                          alt="Generated"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
