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
    return NextResponse.json({ error: 'hotelId required' }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const spaceTypeId = searchParams.get('spaceTypeId');
  const spaceId = searchParams.get('spaceId');

  let query = supabase
    .from('vas_photos')
    .select('*, vas_spaces(name, vas_space_types(name))')
    .eq('hotel_id', hotelId)
    .eq('status', 'active');

  if (spaceId) {
    query = query.eq('space_id', spaceId);
  } else if (spaceTypeId) {
    query = query.eq('space_type_id', spaceTypeId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
