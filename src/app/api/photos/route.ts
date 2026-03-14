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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { hotelId, spaceId, spaceTypeId, originalUrl, filename } = await req.json();
  if (!hotelId || !spaceId || !spaceTypeId || !originalUrl || !filename) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('vas_photos')
    .insert({
      hotel_id: hotelId,
      space_id: spaceId,
      space_type_id: spaceTypeId,
      original_url: originalUrl,
      filename,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role === 'hotel_user') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('vas_photos')
    .update({ status: 'deleted' })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
