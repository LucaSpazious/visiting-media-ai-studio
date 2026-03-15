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
    <div className="bg-luxury-card rounded-xl border border-gold/10 overflow-hidden card-hover">
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-lg font-display font-semibold text-cream">{hotel.name}</h3>
            <p className="text-sm text-cream-dark">
              {hotel.location}{hotel.country ? `, ${hotel.country}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hotel.star_rating > 0 && (
              <span className="text-sm font-medium text-gold">
                {'★'.repeat(hotel.star_rating)}
              </span>
            )}
            <span className={`inline-block w-2 h-2 rounded-full ${hotel.status === 'active' ? 'bg-emerald-500' : 'bg-cream-dark'}`} />
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-luxury-black/50 rounded-lg p-3 border border-luxury-border">
              <p className="text-2xl font-bold text-cream">{stats.totalPhotos}</p>
              <p className="text-[10px] text-cream-dark tracking-wide uppercase">Photos</p>
            </div>
            <div className="bg-luxury-black/50 rounded-lg p-3 border border-luxury-border">
              <p className="text-2xl font-bold text-cream">{stats.totalGenerations}</p>
              <p className="text-[10px] text-cream-dark tracking-wide uppercase">Generations</p>
            </div>
            <div className="bg-luxury-black/50 rounded-lg p-3 border border-luxury-border">
              <p className="text-2xl font-bold text-cream">{stats.totalSpaces}</p>
              <p className="text-[10px] text-cream-dark tracking-wide uppercase">Spaces</p>
            </div>
          </div>
        )}

        {stats && stats.totalSpaces > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-cream-dark mb-1">
              <span>Spaces with photos</span>
              <span>{stats.spacesWithPhotos}/{stats.totalSpaces}</span>
            </div>
            <div className="w-full bg-luxury-border rounded-full h-1.5">
              <div
                className="bg-gold h-1.5 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {stats && stats.recentGenerations.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-cream-dark mb-2 tracking-wide uppercase">Recent generations</p>
            <div className="flex gap-2">
              {stats.recentGenerations.map((gen) => (
                <div key={gen.id} className="w-16 h-16 rounded-lg overflow-hidden border border-gold/10 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={gen.resultUrl} alt={gen.filename || 'Generated'} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gold/10 px-6 py-3 flex items-center gap-3 bg-luxury-black/30">
        <Link href={`/ai-studio/${hotel.slug}`} className="text-sm text-gold hover:text-gold-light font-medium tracking-wide transition-colors">
          Ver fotos
        </Link>
        <span className="text-luxury-border">|</span>
        <Link href={`/ai-studio/${hotel.slug}?tab=generate`} className="text-sm text-cream-muted hover:text-cream font-medium tracking-wide transition-colors">
          Nueva generacion
        </Link>
        <span className="text-luxury-border">|</span>
        <Link href={`/ai-studio/${hotel.slug}/projects`} className="text-sm text-cream-dark hover:text-cream transition-colors">
          Projects
        </Link>
      </div>
    </div>
  );
}
