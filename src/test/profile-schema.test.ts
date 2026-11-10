import { describe, expect, it } from 'vitest';
import { initialAnswers, profileSchema } from '@/lib/profile-schema';
describe('Personal goals', () => {
  it('accepts a weight-loss goal', () => { expect(profileSchema.parse({ ...initialAnswers, display_name: 'Åsa', goal: 'lose' }).goal).toBe('lose'); });
  it('accepts a weight-maintenance goal', () => { expect(profileSchema.parse({ ...initialAnswers, display_name: 'Åsa', goal: 'maintain' }).goal).toBe('maintain'); });
  it('accepts a weight-gain goal', () => { expect(profileSchema.parse({ ...initialAnswers, display_name: 'Åsa', goal: 'gain' }).goal).toBe('gain'); });
  it('rejects unsupported goals', () => { expect(profileSchema.safeParse({ ...initialAnswers, display_name: 'Åsa', goal: 'other' }).success).toBe(false); });
});