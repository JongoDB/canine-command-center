// Re-exports the shared design tokens, lightly aliased for RN ergonomics, plus
// the font *family* names (the actual webfonts aren't bundled yet — system
// stacks render until then; loading Bebas Neue / DM Sans / Space Mono via
// `expo-font` is a Phase-1 polish item).
import { color, fontSize, fontWeight, radius, space, tracking } from '@ccc/ui';

export const theme = {
  colors: color,
  fontSize,
  fontWeight,
  space,
  radius,
  tracking,
} as const;

export { uiStyles } from '@ccc/ui';
