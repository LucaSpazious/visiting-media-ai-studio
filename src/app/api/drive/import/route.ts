import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { authorizeHotelAccess } from '@/lib/authorization';
import { cookies } from 'next/headers';

interface ImportRequest {
  fileIds: string[];
  hotelId: string;
  spaceId: string;
  spaceTypeId: string;
}

interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const driveToken = cookieStore.get('google_drive_token')?.value;
  if (!driveToken) {
    return NextResponse.json(
      { error: 'Google Drive not connected. Please authorize access.' },
      { status: 401 }
    );
  }

  const { fileIds, hotelId, spaceId, spaceTypeId }: ImportRequest = await req.json();

  if (!fileIds?.length || !hotelId || !spaceId || !spaceTypeId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const auth = await authorizeHotelAccess(hotelId);
  if ('error' in auth) return auth.error;

  const supabase = getServiceSupabase();
  const results: { filename: string; success: boolean; error?: string }[] = [];

  for (const fileId of fileIds) {
    try {
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`,
        { headers: { Authorization: `Bearer ${driveToken}` } }
      );
      if (!metaRes.ok) {
        results.push({ filename: fileId, success: false, error: 'Failed to get file metadata' });
        continue;
      }
      const meta: DriveFileMetadata = await metaRes.json();

      if (!meta.mimeType.startsWith('image/')) {
        results.push({ filename: meta.name, success: false, error: 'Not an image' });
        continue;
      }

      const downloadRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${driveToken}` } }
      );
      if (!downloadRes.ok) {
        results.push({ filename: meta.name, success: false, error: 'Failed to download' });
        continue;
      }

      const buffer = Buffer.from(await downloadRes.arrayBuffer());

      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      };
      const ext = extMap[meta.mimeType] || meta.name.split('.').pop() || 'jpg';
      const filePath = `${hotelId}/${spaceId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('vas-photos')
        .upload(filePath, buffer, {
          contentType: meta.mimeType,
          upsert: false,
        });

      if (uploadError) {
        results.push({ filename: meta.name, success: false, error: uploadError.message });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('vas-photos')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('vas_photos')
        .insert({
          hotel_id: hotelId,
          space_id: spaceId,
          space_type_id: spaceTypeId,
          original_url: urlData.publicUrl,
          filename: meta.name,
        });

      if (insertError) {
        results.push({ filename: meta.name, success: false, error: insertError.message });
        continue;
      }

      results.push({ filename: meta.name, success: true });
    } catch (err) {
      results.push({
        filename: fileId,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  return NextResponse.json({ results, successCount, total: fileIds.length });
}
