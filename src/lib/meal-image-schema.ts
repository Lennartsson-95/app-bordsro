import { z } from 'zod';

export const mealImageKeys = [
  ...Array.from({ length: 30 }, (_, i) => `food-${i + 1}`),
  ...Array.from({ length: 12 }, (_, i) => `drink-${i + 1}`),
];
export const mealImageSchema = z.string().refine(key => mealImageKeys.includes(key), 'Välj en bild från mat eller dryck.').nullable();