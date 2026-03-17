import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { getServiceSupabase } from '@/lib/supabase';
import { authorizeHotelAccess } from '@/lib/authorization';

export const maxDuration = 120;

const MAX_RETRIES = 2;

async function callFalWithRetry(
  input: Record<string, unknown>,
  retries: number = MAX_RETRIES
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fal.subscribe('fal-ai/flux-kontext/max', { input });

      const resultData = result.data as { images?: Array<{ url: string }> };
      const generatedUrl = resultData?.images?.[0]?.url;

      if (!generatedUrl) {
        throw new Error('fal.ai returned no image in response');
      }

      return generatedUrl;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[Generate] fal.ai attempt ${attempt + 1}/${retries + 1} failed:`, {
        message: lastError.message,
        name: lastError.name,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err as object)),
      });

      // Don't retry on validation/auth errors (4xx)
      const errMsg = lastError.message.toLowerCase();
      if (errMsg.includes('unauthorized') || errMsg.includes('forbidden') || errMsg.includes('invalid') || errMsg.includes('bad request')) {
        throw lastError;
      }

      // Wait before retry (exponential backoff: 1s, 2s)
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Generation failed after retries');
}

export async function POST(req: Request) {
  console.log('[generate] FAL_KEY present:', !!process.env.FAL_KEY);
  fal.config({
    credentials: process.env.FAL_KEY,
  });

  const { photoId, hotelId, theme, prompt, personImageUrl, personId, imageUrl, projectId } =
    await req.json();

  if (!photoId || !hotelId || !theme || !prompt || !imageUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const auth = await authorizeHotelAccess(hotelId);
  if ('error' in auth) return auth.error;

  const supabase = getServiceSupabase();

  // Create generation record
  const { data: generation, error: insertError } = await supabase
    .from('vas_generations')
    .insert({
      photo_id: photoId,
      hotel_id: hotelId,
      theme,
      prompt,
      person_id: personId || null,
      project_id: projectId || null,
      status: 'processing',
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  try {
    // Build input for FLUX.1 Kontext [max]
    const input: Record<string, unknown> = {
      prompt,
      image_url: imageUrl,
    };

    // If person image provided, include it as multi-image input
    if (personImageUrl) {
      input.prompt = `${prompt}. Include the person from the reference image naturally in the scene.`;
      input.image_url = [imageUrl, personImageUrl];
    }

    const generatedUrl = await callFalWithRetry(input);

    // Update generation record with result
    await supabase
      .from('vas_generations')
      .update({ result_url: generatedUrl, status: 'done' })
      .eq('id', generation.id);

    return NextResponse.json({
      id: generation.id,
      result_url: generatedUrl,
      status: 'done',
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Generation failed';
    console.error('[Generate] Final error:', {
      message: errorMessage,
      falKeyPresent: !!process.env.FAL_KEY,
      falKeyPrefix: process.env.FAL_KEY?.substring(0, 8) + '...',
    });

    await supabase
      .from('vas_generations')
      .update({ status: 'error' })
      .eq('id', generation.id);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
