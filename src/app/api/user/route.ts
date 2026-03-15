import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const { data: user, error } = await supabase
    .from('vas_users')
    .select('id, email, name, role, hotel_id, created_at')
    .eq('email', session.user.email)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // If user has a hotel, fetch hotel info
  let hotel = null;
  if (user.hotel_id) {
    const { data: hotelData } = await supabase
      .from('vas_hotels')
      .select('id, name, slug, location, country')
      .eq('id', user.hotel_id)
      .single();
    hotel = hotelData;
  }

  // For vm_admin, fetch all hotels
  let hotels: { id: string; name: string; slug: string; location: string; country: string }[] = [];
  if (user.role === 'vm_admin') {
    const { data: allHotels } = await supabase
      .from('vas_hotels')
      .select('id, name, slug, location, country')
      .order('name');
    hotels = allHotels || [];
  } else if (hotel) {
    hotels = [hotel];
  }

  return NextResponse.json({ user, hotels });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();
  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('vas_users')
    .update({ name: name.trim() })
    .eq('email', session.user.email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
