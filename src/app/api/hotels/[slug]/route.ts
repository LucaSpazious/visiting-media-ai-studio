import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  const { data: hotel, error } = await supabase
    .from('vas_hotels')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !hotel) {
    return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
  }

  // Get space types with spaces
  const { data: spaceTypes } = await supabase
    .from('vas_space_types')
    .select('*, vas_spaces(*)')
    .eq('hotel_id', hotel.id)
    .order('name');

  return NextResponse.json({ ...hotel, space_types: spaceTypes || [] });
}
