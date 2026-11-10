import { z } from 'zod';

export const ownShoppingItemSchema = z.object({
  item: z.string().trim().min(1).max(120),
  quantity: z.string().trim().max(80).default(''),
});
export type OwnShoppingItem = z.infer<typeof ownShoppingItemSchema>;