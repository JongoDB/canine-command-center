import { describe, expect, it } from 'vitest';
import { BRANDING } from './branding';

describe('BRANDING', () => {
  it('keeps the code-level slug stable', () => {
    expect(BRANDING.slug).toBe('canine-command-center');
  });

  it('exposes user-facing names', () => {
    expect(BRANDING.appName).toBeTruthy();
    expect(BRANDING.assistantName).toBe('Scout');
  });
});
