import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { daySchema, slotSchema } from './meal-plan';

export const getToday = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ day: daySchema }).parse(input))
  .handler(async ({ context, data }) => {
    const [profile, meals] = await Promise.all([
      context.supabase.from('profiles').select('*').eq('id', context.userId).single(),
      context.supabase.from('daily_meals').select('slot, eaten, choice').eq('user_id', context.userId).eq('day', data.day),
    ]);
    if (profile.error || meals.error) throw new Error('Dina måltider kunde inte hämtas. Försök igen.');
    return { profile: profile.data, meals: meals.data };
  });
export const updateMeal = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ day: daySchema, slot: slotSchema, eaten: z.boolean().optional(), choice: z.number().int().min(0).max(1).optional() }).refine(v => v.eaten !== undefined || v.choice !== undefined).parse(input))
  .handler(async ({ context, data }) => {
    const { day, slot } = data;
    const { error } = await context.supabase.from('daily_meals').upsert({ user_id: context.userId, day, slot, ...(data.eaten !== undefined ? { eaten: data.eaten } : {}), ...(data.choice !== undefined ? { choice: data.choice } : {}) }, { onConflict: 'user_id,day,slot', defaultToNull: false });
    if (error) throw new Error('Måltiden kunde inte sparas. Försök igen.');
    return { saved: true };
  });
export const updateReminders = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ enabled: z.boolean(), lead: z.union([z.literal(0),z.literal(5),z.literal(15)]) }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from('profiles').update({ reminders_enabled: data.enabled, reminder_lead: data.lead }).eq('id', context.userId);
    if (error) throw new Error('Påminnelsen kunde inte sparas. Försök igen.');
    return { saved: true };
  });