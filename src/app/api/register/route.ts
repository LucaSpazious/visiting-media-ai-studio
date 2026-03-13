import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: existing } = await supabase
      .from('vas_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const password_hash = await hash(password, 12);

    const { error } = await supabase.from('vas_users').insert({
      id: crypto.randomUUID(),
      email,
      name: name || email.split('@')[0],
      password_hash,
      role: 'hotel_user',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
