import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { authorizeHotelAccess } from '@/lib/authorization';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = getServiceSupabase();

  // Fetch hotel first to get its ID
  const { data: hotel, error } = await supabase
    .from('vas_hotels')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !hotel) {
    return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
  }

  // Authorize access to this hotel
  const auth = await authorizeHotelAccess(hotel.id);
  if ('error' in auth) return auth.error;

  // Get space types with spaces
  const { data: spaceTypes } = await supabase
    .from('vas_space_types')
    .select('*, vas_spaces(*)')
    .eq('hotel_id', hotel.id)
    .order('name');

  return NextResponse.json({ ...hotel, space_types: spaceTypes || [] });
}
