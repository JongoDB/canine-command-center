import { describe, expect, it } from 'vitest';
import { TRACKS, trackColor, trackLabel, tokens } from './tokens';

describe('design tokens', () => {
  it('defines the four training tracks', () => {
    expect(TRACKS).toEqual(['obedience', 'socialization', 'advanced', 'protection']);
  });

  it('has a color set and a label for every track', () => {
    for (const t of TRACKS) {
      expect(trackColor[t]?.label).toMatch(/^#[0-9a-f]{6}$/i);
      expect(trackLabel[t]).toBeTruthy();
    }
  });

  it('exposes the dark-theme background and primary text colors', () => {
    expect(tokens.color.black).toBe('#0a0a0a');
    expect(tokens.color.cream).toBe('#f5f0e8');
  });
});
