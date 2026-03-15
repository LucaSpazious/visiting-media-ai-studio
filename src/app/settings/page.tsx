'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProfileSection from './ProfileSection';
import HotelsSection from './HotelsSection';
import ApiKeysSection from './ApiKeysSection';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  hotel_id: string | null;
  created_at: string;
}

interface HotelInfo {
  id: string;
  name: string;
  slug: string;
  location: string;
  country: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [hotels, setHotels] = useState<HotelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setHotels(data.hotels);
        }
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') fetchUser();
  }, [status]);

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">
                &larr; Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <ProfileSection user={user} onUpdate={setUser} />
            <HotelsSection hotels={hotels} />
            <ApiKeysSection />

            {/* i18n section — prepared for future */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-2">Language</h2>
              <div className="flex items-center gap-3">
                <select
                  disabled
                  className="text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  defaultValue="en"
                >
                  <option value="en">English</option>
                  <option value="es">Espanol</option>
                  <option value="fr">Francais</option>
                  <option value="de">Deutsch</option>
                </select>
                <span className="text-xs text-gray-400">Coming soon</span>
              </div>
            </div>

            {/* Sign out */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
