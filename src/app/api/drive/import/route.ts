import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { authorizeHotelAccess } from '@/lib/authorization';

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
  if (!session?.user?.accessToken) {
    return NextResponse.json(
      { error: 'No Google access token' },
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
  const accessToken = session.user.accessToken;
  const results: { filename: string; success: boolean; error?: string }[] = [];

  for (const fileId of fileIds) {
    try {
      // Get file metadata
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!metaRes.ok) {
        results.push({ filename: fileId, success: false, error: 'Failed to get file metadata' });
        continue;
      }
      const meta: DriveFileMetadata = await metaRes.json();

      // Validate mime type
      if (!meta.mimeType.startsWith('image/')) {
        results.push({ filename: meta.name, success: false, error: 'Not an image' });
        continue;
      }

      // Download file content
      const downloadRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!downloadRes.ok) {
        results.push({ filename: meta.name, success: false, error: 'Failed to download' });
        continue;
      }

      const buffer = Buffer.from(await downloadRes.arrayBuffer());

      // Determine extension from mime type
      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      };
      const ext = extMap[meta.mimeType] || meta.name.split('.').pop() || 'jpg';
      const filePath = `${hotelId}/${spaceId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      // Upload to Supabase Storage
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

      // Create photo record
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
