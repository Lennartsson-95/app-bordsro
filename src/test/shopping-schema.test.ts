import { describe, expect, it } from 'vitest';
import { ownShoppingItemSchema } from '@/lib/shopping-schema';

describe('Own shopping quantities', () => {
  it('allows an optional quantity', () => {
    expect(ownShoppingItemSchema.parse({ item: 'Äpplen' })).toEqual({ item: 'Äpplen', quantity: '' });
  });
  it('accepts counts and packages without changing the item identity', () => {
    expect(ownShoppingItemSchema.parse({ item: 'Äpplen', quantity: ' 2 st ' })).toEqual({ item: 'Äpplen', quantity: '2 st' });
    expect(ownShoppingItemSchema.parse({ item: 'Ris', quantity: 'en påse' })).toEqual({ item: 'Ris', quantity: 'en påse' });
  });
});