// Warm paper, soft ink, and one light per habit. The palette stays quiet so
// the moment a habit lights up is the brightest thing on screen.
export const colors = {
  paper: '#F4F0E8',
  card: '#FBF8F2',
  ink: '#1C1B19',
  mute: '#8A857C',
  line: '#E4DED2',
};

export type Hue = { base: string; glow: string; soft: string };

export const hues: Record<string, Hue> = {
  amber: { base: '#F2A43A', glow: 'rgba(242,164,58,0.45)', soft: '#FBE9CF' },
  sky: { base: '#4C9DF0', glow: 'rgba(76,157,240,0.42)', soft: '#DCEBFB' },
  rose: { base: '#EE6A7C', glow: 'rgba(238,106,124,0.42)', soft: '#FBDDE1' },
  mint: { base: '#3FBF8E', glow: 'rgba(63,191,142,0.42)', soft: '#D6F1E6' },
};

export const ease = {
  // Soft ease-out used for most settles.
  soft: [0.16, 1, 0.3, 1] as const,
};
