import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  size?: string;
}

interface DriveListResponse {
  files?: DriveFile[];
  nextPageToken?: string;
  error?: { message: string };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.accessToken) {
    return NextResponse.json(
      { error: 'No Google access token. Please sign in with Google.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const pageToken = searchParams.get('pageToken') || '';
  const query = searchParams.get('q') || '';

  // Search for image files in Drive
  let driveQuery = "mimeType contains 'image/' and trashed = false";
  if (query) {
    driveQuery += ` and name contains '${query.replace(/'/g, "\\'")}'`;
  }

  const params = new URLSearchParams({
    q: driveQuery,
    fields: 'nextPageToken,files(id,name,mimeType,thumbnailLink,size)',
    pageSize: '30',
    orderBy: 'modifiedTime desc',
  });
  if (pageToken) params.set('pageToken', pageToken);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    }
  );

  const data: DriveListResponse = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message || 'Failed to list Drive files' },
      { status: res.status }
    );
  }

  return NextResponse.json({
    files: data.files || [],
    nextPageToken: data.nextPageToken || null,
  });
}
