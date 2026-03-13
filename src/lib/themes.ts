export interface Theme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  promptHint: string;
}

export const THEMES: Theme[] = [
  {
    id: 'christmas',
    name: 'Christmas',
    emoji: '🎄',
    description: 'Festive winter decorations, lights, holiday atmosphere',
    promptHint: 'Christmas decorations, warm lights, garlands, ornaments, festive holiday atmosphere, winter wonderland',
  },
  {
    id: 'valentines',
    name: "Valentine's Day",
    emoji: '💕',
    description: 'Romantic, roses, candles, perfect for couples and weddings',
    promptHint: 'romantic Valentine\'s Day decorations, red roses, candles, heart-shaped accents, soft pink lighting, romantic ambiance',
  },
  {
    id: 'halloween',
    name: 'Halloween',
    emoji: '🎃',
    description: 'Pumpkins, mysterious atmosphere, elegant spooky decor',
    promptHint: 'elegant Halloween decorations, carved pumpkins, mysterious ambient lighting, tasteful spooky decor, autumn atmosphere',
  },
  {
    id: 'party',
    name: 'Party',
    emoji: '🎉',
    description: 'Generic celebration, balloons, festive atmosphere',
    promptHint: 'celebration decorations, colorful balloons, streamers, festive party atmosphere, joyful ambiance',
  },
  {
    id: 'business',
    name: 'Business',
    emoji: '💼',
    description: 'Corporate environment, meetings, company events',
    promptHint: 'professional corporate setting, business meeting setup, elegant corporate decor, conference atmosphere',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    emoji: '✨',
    description: 'Maximum elegance, premium details, VIP experience',
    promptHint: 'ultra-luxury premium decor, gold accents, crystal chandeliers, VIP exclusive atmosphere, opulent details',
  },
  {
    id: 'family',
    name: 'Family',
    emoji: '👨‍👩‍👧',
    description: 'Warm, welcoming family atmosphere, vacation vibes',
    promptHint: 'warm family-friendly atmosphere, welcoming decor, comfortable vacation setting, playful touches, cozy ambiance',
  },
];
