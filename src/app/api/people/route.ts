import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { authorizeHotelAccess, authorizeByResourceId } from '@/lib/authorization';

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
    .from('vas_people')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const { hotelId, name, imageUrl } = await req.json();
  if (!hotelId || !name || !imageUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const auth = await authorizeHotelAccess(hotelId);
  if ('error' in auth) return auth.error;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('vas_people')
    .insert({ hotel_id: hotelId, name, image_url: imageUrl })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const auth = await authorizeByResourceId('vas_people', id);
  if ('error' in auth) return auth.error;

  if (auth.session.user.role === 'hotel_user') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('vas_people').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
