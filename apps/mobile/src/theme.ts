// Re-exports the shared design tokens, lightly aliased for RN ergonomics, plus
// the bundled font *family* names. The .ttf files live in `assets/fonts/` and
// are loaded by `app/_layout.tsx` via `useFonts` (keys must match the names
// below). DM Sans is loaded as the variable font (default master ≈ Regular).
import { color, fontSize, fontWeight, radius, space, tracking } from '@ccc/ui';

/** Loaded font families — keys match the `useFonts` registration in `_layout.tsx`. */
export const font = {
  display: 'BebasNeue', // condensed all-caps display — screen/section titles, big numbers
  body: 'DMSans', // body / UI text
  mono: 'SpaceMono', // mono uppercase labels, badges, "command words", data
} as const;

export const theme = {
  colors: color,
  font,
  fontSize,
  fontWeight,
  space,
  radius,
  tracking,
} as const;

export { uiStyles } from '@ccc/ui';
