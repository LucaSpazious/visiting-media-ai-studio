import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fal } from '@fal-ai/client';
import { getServiceSupabase } from '@/lib/supabase';

export const maxDuration = 120;

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { photoId, hotelId, theme, prompt, personImageUrl, personId, imageUrl, projectId } =
    await req.json();

  if (!photoId || !hotelId || !theme || !prompt || !imageUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

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
    // Build input for FLUX.1 Kontext
    const input: Record<string, unknown> = {
      prompt,
      image_url: imageUrl,
    };

    // If person image provided, include it
    if (personImageUrl) {
      input.prompt = `${prompt}. Include the person from the reference image naturally in the scene.`;
      input.image_url = [imageUrl, personImageUrl];
    }

    const result = await fal.subscribe('fal-ai/flux-kontext/max', {
      input,
    });

    const resultData = result.data as { images?: Array<{ url: string }> };
    const generatedUrl = resultData?.images?.[0]?.url;

    if (!generatedUrl) {
      throw new Error('No image generated');
    }

    // Update generation record
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
    await supabase
      .from('vas_generations')
      .update({ status: 'error' })
      .eq('id', generation.id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
