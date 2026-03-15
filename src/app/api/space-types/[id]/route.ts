import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { authorizeByResourceId } from '@/lib/authorization';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authorizeByResourceId('vas_space_types', params.id);
  if ('error' in auth) return auth.error;

  const { name } = await req.json();
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('vas_space_types')
    .update({ name })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authorizeByResourceId('vas_space_types', params.id);
  if ('error' in auth) return auth.error;

  if (auth.session.user.role === 'hotel_user') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const supabase = getServiceSupabase();

  // Delete all spaces under this type first
  await supabase.from('vas_spaces').delete().eq('space_type_id', params.id);

  const { error } = await supabase
    .from('vas_space_types')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
