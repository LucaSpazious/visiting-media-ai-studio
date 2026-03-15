import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { THEMES } from '@/lib/themes';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { themeId, spaceName, spaceType, personName } = await req.json();

  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) {
    return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
  }

  const personContext = personName
    ? `Include a person named "${personName}" naturally in the scene, as if they belong there.`
    : '';

  const fallbackPrompt = `Transform this hotel photo with a ${theme.name} theme. Add elegant seasonal decorations, warm ambient lighting, and a welcoming atmosphere that feels natural and high-quality.${personContext ? ` ${personContext}` : ''}`;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[Prompt API] ANTHROPIC_API_KEY is not set, using fallback prompt');
    return NextResponse.json({ prompt: fallbackPrompt });
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are an expert at writing image transformation prompts for FLUX.1 Kontext, an AI model that transforms existing photos.

Generate a concise, specific prompt to transform a hotel ${spaceType || 'space'} photo${spaceName ? ` (${spaceName})` : ''} with a "${theme.name}" theme.

Theme details: ${theme.promptHint}
${personContext}

Rules:
- Start with "Transform this hotel photo to"
- Be specific about decorations, lighting, atmosphere
- Keep it under 80 words
- Do not mention the AI model or technical details
- Make it feel natural and high-quality

Output ONLY the prompt text, nothing else.`,
        },
      ],
    });

    const prompt =
      message.content[0].type === 'text' ? message.content[0].text : fallbackPrompt;

    return NextResponse.json({ prompt });
  } catch (err) {
    console.error('[Prompt API] Anthropic error, using fallback:', err);
    return NextResponse.json({ prompt: fallbackPrompt });
  }
}
