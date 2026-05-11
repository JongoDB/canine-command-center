/**
 * A small set of shared, framework-agnostic style objects derived from the
 * tokens — the seed of the cross-platform primitive layer. The values are plain
 * camelCase style props that both React Native's `StyleSheet` and React's
 * inline `style` accept; numeric values are density-independent pixels on RN and
 * `px` on web. Full component primitives (Badge, ScreenHeader, TimelinePhase,
 * CommandCard, …) build on these in Phase 1 — see docs/DESIGN.md §4.
 */
import { color, fontSize, fontWeight, radius, space, tracking } from './tokens';

export const uiStyles = {
  /** App background fill. */
  screen: {
    flex: 1,
    backgroundColor: color.black,
  },
  /** A surface/card. */
  card: {
    backgroundColor: color.steel,
    borderColor: color.hairline,
    borderWidth: 1,
    padding: space['2xl'],
  },
  /** Small mono uppercase "eyebrow" label. */
  eyebrow: {
    color: color.tan,
    fontSize: fontSize.label,
    letterSpacing: tracking.wider,
    textTransform: 'uppercase' as const,
    fontWeight: fontWeight.bold,
  },
  /** Muted secondary text. */
  muted: {
    color: color.textMuted,
    fontSize: fontSize.bodySm,
  },
  /** Primary action button (background). */
  button: {
    backgroundColor: color.tan,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    alignItems: 'center' as const,
  },
  /** Primary action button (label). */
  buttonText: {
    color: color.black,
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.bold,
    letterSpacing: tracking.wide,
    textTransform: 'uppercase' as const,
  },
  /** Form text input. */
  input: {
    backgroundColor: color.black,
    borderColor: color.steelMid,
    borderWidth: 1,
    color: color.cream,
    fontSize: fontSize.body,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
  },
} as const;

export type UiStyles = typeof uiStyles;
