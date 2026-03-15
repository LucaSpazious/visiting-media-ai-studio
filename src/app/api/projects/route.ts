import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { authorizeHotelAccess } from '@/lib/authorization';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');
  if (!hotelId) {
    return NextResponse.json({ error: 'hotelId required' }, { status: 400 });
  }

  const auth = await authorizeHotelAccess(hotelId);
  if ('error' in auth) return auth.error;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('vas_projects')
    .select('*, vas_people(name, image_url), vas_generations(id, result_url, status, prompt, vas_photos(id, filename, original_url, space_id, vas_spaces(name, vas_space_types(name))))')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const { hotelId, name, theme, personId, scopeType, scopeId } = await req.json();
  if (!hotelId || !name || !theme || !scopeType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const auth = await authorizeHotelAccess(hotelId);
  if ('error' in auth) return auth.error;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('vas_projects')
    .insert({
      hotel_id: hotelId,
      name,
      theme,
      person_id: personId || null,
      scope_type: scopeType,
      scope_id: scopeId || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
