'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Person {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
}

interface Hotel {
  id: string;
  name: string;
  slug: string;
}

export default function PeopleBankPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const hotelSlug = params.hotelSlug as string;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/hotels/${hotelSlug}`);
        if (res.ok) {
          const data = await res.json();
          setHotel(data);

          const peopleRes = await fetch(`/api/people?hotelId=${data.id}`);
          if (peopleRes.ok) {
            setPeople(await peopleRes.json());
          }
        }
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchData();
  }, [status, hotelSlug]);

  async function handleUpload() {
    if (!hotel || !newName.trim() || !fileInputRef.current?.files?.[0]) return;

    setUploading(true);
    try {
      const file = fileInputRef.current.files[0];
      const ext = file.name.split('.').pop();
      const filePath = `${hotel.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('vas-people')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('vas-people')
        .getPublicUrl(filePath);

      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: hotel.id,
          name: newName.trim(),
          imageUrl: urlData.publicUrl,
        }),
      });

      if (res.ok) {
        const person = await res.json();
        setPeople((prev) => [person, ...prev]);
        setNewName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this person?')) return;

    const res = await fetch(`/api/people?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPeople((prev) => prev.filter((p) => p.id !== id));
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const canDelete = session?.user.role !== 'hotel_user';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link
                href={`/ai-studio/${hotelSlug}`}
                className="text-gray-500 hover:text-gray-900"
              >
                &larr; AI Studio
              </Link>
              <h1 className="text-xl font-bold text-gray-900">
                People Bank — {hotel?.name}
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload form */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Add Person</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder='e.g. "Wedding Couple", "Business Group"'
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || !newName.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {uploading ? 'Uploading...' : 'Add Person'}
            </button>
          </div>
        </div>

        {/* People list */}
        {people.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500">No people in this bank yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Add people to include them in your AI generations
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {people.map((person) => (
              <div
                key={person.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
              >
                <div className="aspect-square relative bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={person.image_url}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <p className="font-medium text-gray-900">{person.name}</p>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(person.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
