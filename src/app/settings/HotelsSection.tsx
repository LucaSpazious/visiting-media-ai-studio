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
    <div className="bg-luxury-card rounded-xl p-6 border border-gold/10">
      <h2 className="font-display font-semibold text-cream mb-4">Assigned Hotels</h2>
      {hotels.length === 0 ? (
        <p className="text-sm text-cream-dark">No hotels assigned to your account.</p>
      ) : (
        <div className="space-y-3">
          {hotels.map((hotel) => (
            <Link
              key={hotel.id}
              href={`/ai-studio/${hotel.slug}`}
              className="flex items-center justify-between p-3 rounded-lg border border-luxury-border hover:border-gold/20 hover:bg-luxury-hover transition-all group"
            >
              <div>
                <p className="text-sm font-medium text-cream group-hover:text-gold transition-colors">
                  {hotel.name}
                </p>
                <p className="text-xs text-cream-dark">
                  {hotel.location}{hotel.country ? `, ${hotel.country}` : ''}
                </p>
              </div>
              <svg className="w-4 h-4 text-cream-dark group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
