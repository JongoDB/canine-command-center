/**
 * Design tokens — the "tactical K9 field journal" language from docs/DESIGN.md
 * (derived from the owner's reference artifact). One source of truth; the mobile
 * client renders these with React Native styles, the web client with CSS vars.
 * Component primitives that consume these land in M0.6.
 */

/** Core palette. Dark theme only for v1 (a light theme is a Phase-5 maybe). */
export const color = {
  black: '#0a0a0a', // app background
  steel: '#2a2f3a', // card / surface
  steelMid: '#3d4455', // raised surface, hover/press, hairlines
  cream: '#f5f0e8', // primary text
  textMuted: '#8a8a8a', // secondary text
  tan: '#c8a46e', // primary accent
  tanLight: '#e8c99a', // accent on dark cards
  khaki: '#8b7355', // tertiary accent
  accent: '#d4572a', // warnings / emergencies (also the Protection track)
  accentLight: '#e8826a',
  // near-black dividers, lightest → darkest
  hairline: '#1f1f1f',
  hairlineDim: '#1a1a1a',
  hairlineFaint: '#1e1e1e',
  hairlineDeep: '#111111',
} as const;

/** The four training tracks. `track` is a real data field on skills/modules/tasks. */
export const TRACKS = ['obedience', 'socialization', 'advanced', 'protection'] as const;
export type Track = (typeof TRACKS)[number];

export const trackColor: Record<Track, { label: string; word: string; dot: string }> = {
  // label = the group-label color, word = the command-word color, dot = legend dot
  obedience: { label: color.tan, word: color.tanLight, dot: color.tan },
  socialization: { label: '#9b8fd4', word: '#b8acdf', dot: '#b8acdf' },
  advanced: { label: '#7ac5c5', word: '#7ac5c5', dot: '#7ac5c5' },
  protection: { label: color.accent, word: color.accentLight, dot: color.accentLight },
};

export const trackLabel: Record<Track, string> = {
  obedience: 'Obedience',
  socialization: 'Socialization & Life Skills',
  advanced: 'Advanced / Working',
  protection: 'Protection / Bite Sport',
};

/** Typeface roles (webfonts loaded on web; closest system stack on mobile). */
export const font = {
  display: 'Bebas Neue', // big condensed screen titles & numbers
  body: 'DM Sans', // body / UI text
  mono: 'Space Mono', // labels, badges, "command words", data
} as const;

/** Type scale (px). */
export const fontSize = {
  display1: 96, // hero title (clamps down on small screens)
  display2: 42, // age numbers, big stats
  title: 28, // screen / section titles
  body: 14,
  bodySm: 12,
  label: 10, // mono uppercase labels
  micro: 9, // tightest mono label
} as const;

export const fontWeight = { light: 300, regular: 400, medium: 500, bold: 700 } as const;

/** Letter-spacing (px) for the mono/uppercase look. */
export const tracking = { tight: 0.3, normal: 1, wide: 2, wider: 3 } as const;

/** 4px-based spacing scale. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 60,
  '6xl': 80,
} as const;

/** The aesthetic is hard-edged; radii stay minimal. */
export const radius = { none: 0, sm: 1, md: 2, pill: 999 } as const;

export const tokens = {
  color,
  trackColor,
  trackLabel,
  font,
  fontSize,
  fontWeight,
  tracking,
  space,
  radius,
} as const;

export type Tokens = typeof tokens;
