import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(not set)',
    VERCEL_URL: process.env.VERCEL_URL || '(not set)',
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    FAL_KEY: !!process.env.FAL_KEY,
    FAL_KEY_format: process.env.FAL_KEY
      ? {
          length: process.env.FAL_KEY.length,
          starts_with_key_: process.env.FAL_KEY.startsWith('key_'),
          prefix: process.env.FAL_KEY.substring(0, 12) + '...',
          contains_colon: process.env.FAL_KEY.includes(':'),
          parts_if_colon: process.env.FAL_KEY.includes(':') ? process.env.FAL_KEY.split(':').length : 1,
        }
      : '(not set)',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL || '(not set)',
    computed_callback_url: `${process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}` || 'UNKNOWN'}/api/auth/callback/google`,
  };

  return NextResponse.json(envCheck);
}
