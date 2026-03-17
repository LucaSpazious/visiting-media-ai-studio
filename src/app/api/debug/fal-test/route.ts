import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

export async function GET() {
  const falKey = process.env.FAL_KEY;

  const diagnostics: Record<string, unknown> = {
    FAL_KEY_present: !!falKey,
    FAL_KEY_length: falKey?.length,
    FAL_KEY_prefix: falKey?.substring(0, 15) + '...',
    FAL_KEY_starts_with_key_: falKey?.startsWith('key_'),
    FAL_KEY_contains_colon: falKey?.includes(':'),
    FAL_KEY_has_whitespace: falKey !== falKey?.trim(),
    FAL_KEY_has_newline: falKey?.includes('\n'),
    FAL_KEY_has_quotes: falKey?.startsWith('"') || falKey?.startsWith("'"),
  };

  // Test 1: Try with explicit config
  try {
    if (falKey) {
      fal.config({ credentials: falKey });
    }
    const result = await fal.subscribe('fal-ai/flux-kontext/max', {
      input: {
        prompt: 'A simple test image of a blue square on white background',
        image_url: 'https://fal.media/files/placeholder.png',
      },
    });
    diagnostics.test_explicit_config = {
      success: true,
      has_images: !!(result.data as Record<string, unknown>)?.images,
    };
  } catch (err) {
    const error = err as Error & { status?: number; body?: unknown };
    diagnostics.test_explicit_config = {
      success: false,
      message: error.message,
      status: error.status,
      body: error.body,
      name: error.name,
      full: JSON.stringify(err, Object.getOwnPropertyNames(err)),
    };
  }

  return NextResponse.json(diagnostics);
}
