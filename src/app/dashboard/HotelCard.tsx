'use client';

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

interface RecentGeneration {
  id: string;
  resultUrl: string;
  originalUrl: string | null;
  filename: string | null;
  createdAt: string;
}

interface HotelStats {
  totalPhotos: number;
  totalGenerations: number;
  totalSpaces: number;
  spacesWithPhotos: number;
  recentGenerations: RecentGeneration[];
}

interface HotelCardProps {
  hotel: Hotel;
  stats?: HotelStats;
}

export default function HotelCard({ hotel, stats }: HotelCardProps) {
  const progressPercent = stats && stats.totalSpaces > 0
    ? Math.round((stats.spacesWithPhotos / stats.totalSpaces) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{hotel.name}</h3>
            <p className="text-sm text-gray-500">
              {hotel.location}{hotel.country ? `, ${hotel.country}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hotel.star_rating > 0 && (
              <span className="text-sm font-medium text-amber-600">
                {'★'.repeat(hotel.star_rating)}
              </span>
            )}
            <span className={`inline-block w-2 h-2 rounded-full ${hotel.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">{stats.totalPhotos}</p>
              <p className="text-xs text-gray-500">Photos</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">{stats.totalGenerations}</p>
              <p className="text-xs text-gray-500">Generations</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-900">{stats.totalSpaces}</p>
              <p className="text-xs text-gray-500">Spaces</p>
            </div>
          </div>
        )}

        {stats && stats.totalSpaces > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Spaces with photos</span>
              <span>{stats.spacesWithPhotos}/{stats.totalSpaces}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {stats && stats.recentGenerations.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Recent generations</p>
            <div className="flex gap-2">
              {stats.recentGenerations.map((gen) => (
                <div key={gen.id} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gen.resultUrl}
                    alt={gen.filename || 'Generated'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 px-6 py-3 flex items-center gap-3 bg-gray-50/50">
        <Link
          href={`/ai-studio/${hotel.slug}`}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Ver fotos
        </Link>
        <span className="text-gray-200">|</span>
        <Link
          href={`/ai-studio/${hotel.slug}?tab=generate`}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Nueva generacion
        </Link>
        <span className="text-gray-200">|</span>
        <Link
          href={`/ai-studio/${hotel.slug}/projects`}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Projects
        </Link>
      </div>
    </div>
  );
}
