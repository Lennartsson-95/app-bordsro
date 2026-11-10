import { describe, expect, it } from 'vitest';
import { initialAnswers, profileSchema } from '@/lib/profile-schema';
describe('Personal goals', () => {
  it('accepts a weight-loss goal', () => { expect(profileSchema.parse({ ...initialAnswers, display_name: 'Åsa', goal: 'lose' }).goal).toBe('lose'); });
  it('accepts a weight-maintenance goal', () => { expect(profileSchema.parse({ ...initialAnswers, display_name: 'Åsa', goal: 'maintain' }).goal).toBe('maintain'); });
  it('accepts a weight-gain goal', () => { expect(profileSchema.parse({ ...initialAnswers, display_name: 'Åsa', goal: 'gain' }).goal).toBe('gain'); });
  it('rejects unsupported goals', () => { expect(profileSchema.safeParse({ ...initialAnswers, display_name: 'Åsa', goal: 'other' }).success).toBe(false); });
});
describe('Ålder och kön', () => {
  it('lämnar ålder och kön tomma för att båda är valfria', () => {
    const parsed = profileSchema.parse({ ...initialAnswers, display_name: 'Åsa' });
    expect(parsed.age).toBeNull();
    expect(parsed.sex).toBeNull();
  });
  it('avvisar en ålder utanför 13 till 100 år', () => {
    expect(profileSchema.safeParse({ ...initialAnswers, display_name: 'Åsa', age: 12 }).success).toBe(false);
    expect(profileSchema.safeParse({ ...initialAnswers, display_name: 'Åsa', age: 101 }).success).toBe(false);
    expect(profileSchema.parse({ ...initialAnswers, display_name: 'Åsa', age: 35 }).age).toBe(35);
  });
  it('avvisar ett kön utanför de givna alternativen', () => {
    expect(profileSchema.safeParse({ ...initialAnswers, display_name: 'Åsa', sex: 'x' }).success).toBe(false);
    expect(profileSchema.parse({ ...initialAnswers, display_name: 'Åsa', sex: 'prefer_not_to_say' }).sex).toBe('prefer_not_to_say');
  });
});