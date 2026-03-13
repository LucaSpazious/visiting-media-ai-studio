'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Hotel {
  id: string;
  name: string;
  slug: string;
  location: string;
  country: string;
  star_rating: number;
  status: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchHotels() {
      try {
        const res = await fetch('/api/hotels');
        if (res.ok) {
          const data = await res.json();
          setHotels(data);
        }
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') {
      fetchHotels();
    }
  }, [status]);

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const userRole = session.user.role;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">AI Studio</h1>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {userRole?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.user.email}</span>
              <Link
                href="/settings"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Hotels</h2>
          <p className="text-gray-500 mt-1">Select a hotel to open the AI Studio</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-500">No hotels found.</p>
            {userRole === 'vm_admin' && (
              <p className="text-sm text-gray-400 mt-2">
                Hotels will appear here once created.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <Link
                key={hotel.id}
                href={`/ai-studio/${hotel.slug}`}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {hotel.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {hotel.location}{hotel.country ? `, ${hotel.country}` : ''}
                    </p>
                  </div>
                  {hotel.star_rating && (
                    <span className="text-sm font-medium text-amber-600">
                      {'★'.repeat(hotel.star_rating)}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${hotel.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-xs text-gray-400 capitalize">{hotel.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
