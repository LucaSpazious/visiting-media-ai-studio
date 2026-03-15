import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';
import { getServiceSupabase } from './supabase';

interface AuthorizedSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    hotel_id: string | null;
  };
}

/**
 * Validates that the current user has access to the given hotelId.
 * - vm_admin: can access any hotel
 * - hotel_user: can only access their assigned hotel
 * - RLS_BYPASS env var disables checks in development
 *
 * Returns the session if authorized, or a NextResponse error.
 */
export async function authorizeHotelAccess(
  hotelId: string
): Promise<{ session: AuthorizedSession } | { error: NextResponse }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = session.user as AuthorizedSession['user'];

  // Development bypass
  if (process.env.RLS_BYPASS === 'true') {
    return { session: { user } };
  }

  // vm_admin can access everything
  if (user.role === 'vm_admin') {
    return { session: { user } };
  }

  // hotel_user with assigned hotel must match
  if (user.hotel_id && user.hotel_id !== hotelId) {
    return { error: NextResponse.json({ error: 'Forbidden: no access to this hotel' }, { status: 403 }) };
  }

  // hotel_user without hotel_id: auto-assign to the requested hotel (demo fallback)
  if (!user.hotel_id) {
    const supabase = getServiceSupabase();
    await supabase
      .from('vas_users')
      .update({ hotel_id: hotelId })
      .eq('email', user.email);
    user.hotel_id = hotelId;
  }

  return { session: { user } };
}

/**
 * For routes that receive a resource ID (not hotelId directly),
 * looks up the hotel_id from the resource and validates access.
 */
export async function authorizeByResourceId(
  table: string,
  resourceId: string
): Promise<{ session: AuthorizedSession; hotelId: string } | { error: NextResponse }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = session.user as AuthorizedSession['user'];

  // Development bypass
  if (process.env.RLS_BYPASS === 'true') {
    // Still need to fetch hotel_id for the resource
    const supabase = getServiceSupabase();
    const { data } = await supabase
      .from(table)
      .select('hotel_id')
      .eq('id', resourceId)
      .single();

    return { session: { user }, hotelId: data?.hotel_id || '' };
  }

  // vm_admin can access everything
  if (user.role === 'vm_admin') {
    const supabase = getServiceSupabase();
    const { data } = await supabase
      .from(table)
      .select('hotel_id')
      .eq('id', resourceId)
      .single();

    if (!data) {
      return { error: NextResponse.json({ error: 'Resource not found' }, { status: 404 }) };
    }

    return { session: { user }, hotelId: data.hotel_id };
  }

  // hotel_user: verify ownership
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from(table)
    .select('hotel_id')
    .eq('id', resourceId)
    .single();

  if (!data) {
    return { error: NextResponse.json({ error: 'Resource not found' }, { status: 404 }) };
  }

  if (!user.hotel_id || user.hotel_id !== data.hotel_id) {
    return { error: NextResponse.json({ error: 'Forbidden: no access to this hotel' }, { status: 403 }) };
  }

  return { session: { user }, hotelId: data.hotel_id };
}

/**
 * Simple session check — for routes that don't need hotel authorization.
 */
export async function requireAuth(): Promise<
  { session: AuthorizedSession } | { error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { session: { user: session.user as AuthorizedSession['user'] } };
}
