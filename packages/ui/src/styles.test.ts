import { describe, expect, it } from 'vitest';
import { uiStyles } from './styles';
import { color } from './tokens';

describe('uiStyles', () => {
  it('derives surface/background colours from the tokens', () => {
    expect(uiStyles.screen.backgroundColor).toBe(color.black);
    expect(uiStyles.card.backgroundColor).toBe(color.steel);
    expect(uiStyles.button.backgroundColor).toBe(color.tan);
  });

  it('uses numeric spacing (RN dp / web px) and uppercase mono labels', () => {
    expect(typeof uiStyles.card.padding).toBe('number');
    expect(uiStyles.eyebrow.textTransform).toBe('uppercase');
  });
});
