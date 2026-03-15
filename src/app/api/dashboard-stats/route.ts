import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');
  if (!hotelId) {
    return NextResponse.json({ error: 'Missing hotelId' }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const [photosRes, generationsRes, spacesRes, recentGensRes] = await Promise.all([
    supabase.from('vas_photos').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    supabase.from('vas_generations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    supabase.from('vas_spaces').select('id').eq('hotel_id', hotelId),
    supabase
      .from('vas_generations')
      .select('id, result_url, status, created_at, vas_photos(original_url, filename)')
      .eq('hotel_id', hotelId)
      .eq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  // Count spaces that have at least one photo
  const spaceIds = (spacesRes.data || []).map((s) => s.id);
  let spacesWithPhotos = 0;
  if (spaceIds.length > 0) {
    const { data: photosInSpaces } = await supabase
      .from('vas_photos')
      .select('space_id')
      .eq('hotel_id', hotelId)
      .in('space_id', spaceIds);

    const uniqueSpaces = new Set((photosInSpaces || []).map((p) => p.space_id));
    spacesWithPhotos = uniqueSpaces.size;
  }

  return NextResponse.json({
    totalPhotos: photosRes.count || 0,
    totalGenerations: generationsRes.count || 0,
    totalSpaces: spaceIds.length,
    spacesWithPhotos,
    recentGenerations: (recentGensRes.data || []).map((g) => ({
      id: g.id,
      resultUrl: g.result_url,
      status: g.status,
      createdAt: g.created_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originalUrl: (g.vas_photos as any)?.original_url || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filename: (g.vas_photos as any)?.filename || null,
    })),
  });
}
