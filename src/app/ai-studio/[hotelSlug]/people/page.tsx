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
          if (peopleRes.ok) setPeople(await peopleRes.json());
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

      const { error: uploadError } = await supabase.storage.from('vas-people').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('vas-people').getPublicUrl(filePath);
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: hotel.id, name: newName.trim(), imageUrl: urlData.publicUrl }),
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
    if (res.ok) setPeople((prev) => prev.filter((p) => p.id !== id));
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-black">
        <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const canDelete = session?.user.role !== 'hotel_user';

  return (
    <div className="min-h-screen bg-luxury-black">
      <nav className="bg-gradient-to-r from-luxury-surface via-luxury-card to-luxury-surface border-b border-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href={`/ai-studio/${hotelSlug}`} className="text-cream-dark hover:text-cream transition-colors">
                &larr; AI Studio
              </Link>
              <h1 className="text-xl font-display font-bold text-cream">
                People Bank
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-luxury-card rounded-xl p-6 border border-gold/10 mb-8">
          <h2 className="font-display font-semibold text-cream mb-4">Add Person</h2>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-cream-dark mb-1.5 tracking-wide uppercase">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 bg-luxury-black border border-luxury-border rounded-lg text-cream placeholder-cream-dark text-sm"
                placeholder='e.g. "Wedding Couple", "Business Group"'
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-cream-dark mb-1.5 tracking-wide uppercase">Photo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="w-full text-sm text-cream-dark file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gold/20 file:text-sm file:font-medium file:bg-gold/10 file:text-gold hover:file:bg-gold/20 file:cursor-pointer"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || !newName.trim()}
              className="px-6 py-2 bg-gold text-luxury-black rounded-lg font-semibold text-sm tracking-wide hover:bg-gold-light disabled:opacity-50 transition-all whitespace-nowrap"
            >
              {uploading ? 'Uploading...' : 'Add Person'}
            </button>
          </div>
        </div>

        {people.length === 0 ? (
          <div className="bg-luxury-card rounded-xl p-12 text-center border border-luxury-border">
            <p className="text-cream-muted">No people in this bank yet</p>
            <p className="text-cream-dark text-sm mt-1">Add people to include them in your AI generations</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {people.map((person) => (
              <div key={person.id} className="bg-luxury-card rounded-xl overflow-hidden border border-gold/10 card-hover">
                <div className="aspect-square relative bg-luxury-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={person.image_url} alt={person.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <p className="font-medium text-cream">{person.name}</p>
                  {canDelete && (
                    <button onClick={() => handleDelete(person.id)} className="text-red-400 hover:text-red-300 text-sm transition-colors">
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
