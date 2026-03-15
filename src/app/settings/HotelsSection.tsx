'use client';

import Link from 'next/link';

interface HotelInfo {
  id: string;
  name: string;
  slug: string;
  location: string;
  country: string;
}

interface HotelsSectionProps {
  hotels: HotelInfo[];
}

export default function HotelsSection({ hotels }: HotelsSectionProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="font-semibold text-gray-900 mb-4">Assigned Hotels</h2>
      {hotels.length === 0 ? (
        <p className="text-sm text-gray-400">No hotels assigned to your account.</p>
      ) : (
        <div className="space-y-3">
          {hotels.map((hotel) => (
            <Link
              key={hotel.id}
              href={`/ai-studio/${hotel.slug}`}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                  {hotel.name}
                </p>
                <p className="text-xs text-gray-500">
                  {hotel.location}{hotel.country ? `, ${hotel.country}` : ''}
                </p>
              </div>
              <svg
                className="w-4 h-4 text-gray-300 group-hover:text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
