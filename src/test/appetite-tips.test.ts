import { describe, expect, it } from 'vitest';
import { appetiteAlternative } from '@/lib/appetite-tips';
describe('Meal-specific appetite alternatives', () => {
  it('offers a protein drink for breakfast', () => { expect(appetiteAlternative('breakfast')).toBe('protein-drink'); });
  it('offers a drink for snacks', () => {
    expect(appetiteAlternative('snack1')).toBe('drink');
    expect(appetiteAlternative('snack2')).toBe('drink');
  });
  it('offers a smoothie for lunch', () => { expect(appetiteAlternative('lunch')).toBe('smoothie'); });
  it('offers a smoothie for dinner', () => { expect(appetiteAlternative('dinner')).toBe('smoothie'); });
});