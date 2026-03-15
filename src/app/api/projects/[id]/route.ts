import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { authorizeByResourceId } from '@/lib/authorization';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authorizeByResourceId('vas_projects', params.id);
  if ('error' in auth) return auth.error;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('vas_projects')
    .select('*, vas_people(name, image_url), vas_generations(id, result_url, status, prompt, vas_photos(id, filename, original_url, space_id, vas_spaces(name, space_type_id, vas_space_types(name))))')
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authorizeByResourceId('vas_projects', params.id);
  if ('error' in auth) return auth.error;

  const body = await req.json();
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('vas_projects')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
