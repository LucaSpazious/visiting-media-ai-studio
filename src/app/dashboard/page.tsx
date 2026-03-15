'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import HotelCard from './HotelCard';

interface Hotel {
  id: string;
  name: string;
  slug: string;
  location: string;
  country: string;
  star_rating: number;
  status: string;
}

interface HotelStats {
  totalPhotos: number;
  totalGenerations: number;
  totalSpaces: number;
  spacesWithPhotos: number;
  recentGenerations: {
    id: string;
    resultUrl: string;
    originalUrl: string | null;
    filename: string | null;
    createdAt: string;
  }[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, HotelStats>>({});

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchHotels() {
      try {
        const res = await fetch('/api/hotels');
        if (res.ok) {
          const data: Hotel[] = await res.json();
          setHotels(data);
          const statsEntries = await Promise.all(
            data.map(async (hotel) => {
              try {
                const statsRes = await fetch(`/api/dashboard-stats?hotelId=${hotel.id}`);
                if (statsRes.ok) {
                  const hotelStats: HotelStats = await statsRes.json();
                  return [hotel.id, hotelStats] as const;
                }
              } catch { /* skip */ }
              return [hotel.id, null] as const;
            })
          );
          const statsMap: Record<string, HotelStats> = {};
          for (const [id, s] of statsEntries) {
            if (s) statsMap[id] = s;
          }
          setStats(statsMap);
        }
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchHotels();
  }, [status]);

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-black">
        <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const userRole = session.user.role;

  return (
    <div className="min-h-screen bg-luxury-black">
      <nav className="bg-gradient-to-r from-luxury-surface via-luxury-card to-luxury-surface border-b border-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-display font-bold text-cream">AI Studio</h1>
              <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full font-medium tracking-widest uppercase border border-gold/20">
                {userRole?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-cream-dark hidden sm:block">{session.user.email}</span>
              <Link href="/settings" className="text-sm text-cream-dark hover:text-cream transition-colors">
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-cream">Hotels</h2>
          <p className="text-cream-dark mt-1">Select a hotel to open the AI Studio</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-luxury-card rounded-xl p-6 animate-pulse border border-luxury-border">
                <div className="h-6 bg-luxury-hover rounded w-3/4 mb-3" />
                <div className="h-4 bg-luxury-hover rounded w-1/2 mb-6" />
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-16 bg-luxury-hover rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="bg-luxury-card rounded-xl p-12 text-center border border-luxury-border">
            <p className="text-cream-muted">No hotels found.</p>
            {userRole === 'vm_admin' && (
              <p className="text-sm text-cream-dark mt-2">Hotels will appear here once created.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} stats={stats[hotel.id]} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
