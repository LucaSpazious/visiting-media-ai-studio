import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { authorizeHotelAccess } from '@/lib/authorization';

export async function POST(req: Request) {
  const { hotelId, spaceTypeId, name } = await req.json();
  if (!hotelId || !spaceTypeId || !name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const auth = await authorizeHotelAccess(hotelId);
  if ('error' in auth) return auth.error;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('vas_spaces')
    .insert({ hotel_id: hotelId, space_type_id: spaceTypeId, name })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
