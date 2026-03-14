import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const hotelId = formData.get('hotelId') as string;
  const spaceId = formData.get('spaceId') as string;

  if (!file || !hotelId || !spaceId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const ext = file.name.split('.').pop();
  const filePath = `${hotelId}/${spaceId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('vas-photos')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from('vas-photos')
    .getPublicUrl(filePath);

  return NextResponse.json({
    url: urlData.publicUrl,
    filename: file.name,
  });
}
