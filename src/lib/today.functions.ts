import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { workoutSchema } from './profile-schema';
import { daySchema, slotSchema, mealEditSchema } from './meal-plan';

export const getToday = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ day: daySchema }).parse(input))
  .handler(async ({ context, data }) => {
    const [profile, meals] = await Promise.all([
      context.supabase.from('profiles').select('*').eq('id', context.userId).single(),
      context.supabase.from('daily_meals').select('*').eq('user_id', context.userId).eq('day', data.day),
    ]);
    const workouts = await context.supabase.from('workouts').select('id, day, kind, minutes, intensity').eq('user_id', context.userId).eq('day', data.day).order('created_at');
    if (profile.error || meals.error || workouts.error) throw new Error('Dina måltider kunde inte hämtas. Försök igen.');
    return { profile: profile.data, meals: meals.data, workouts: workouts.data };
  });
export const updateMeal = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ day: daySchema, slot: slotSchema, eaten: z.boolean().optional(), choice: z.number().int().min(0).max(9).optional() }).refine(v => v.eaten !== undefined || v.choice !== undefined).parse(input))
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
export const getWeek = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ start: daySchema, end: daySchema }).parse(input))
  .handler(async ({ context, data }) => {
    const [profile, meals] = await Promise.all([
      context.supabase.from('profiles').select('*').eq('id', context.userId).single(),
      context.supabase.from('daily_meals').select('*').eq('user_id', context.userId).gte('day', data.start).lte('day', data.end),
    ]);
    const workouts = await context.supabase.from('workouts').select('id, day, kind, minutes, intensity').eq('user_id', context.userId).gte('day', data.start).lte('day', data.end);
    if (profile.error || meals.error || workouts.error) throw new Error('Veckans måltider kunde inte hämtas.');
    return { profile: profile.data, meals: meals.data, workouts: workouts.data };
  });
export const editMeal = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => mealEditSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { choice, ...rest } = data;
    const { error } = await context.supabase.from('daily_meals').upsert({ user_id: context.userId, ...rest, ...(choice !== undefined ? { choice } : {}) }, { onConflict: 'user_id,day,slot', defaultToNull: false });
    if (error) throw new Error('Måltiden kunde inte sparas. Försök igen.');
    return { saved: true };
  });
export const addWorkout = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => workoutSchema.extend({ day: daySchema }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from('workouts').insert({ ...data, user_id: context.userId });
    if (error) throw new Error('Träningen kunde inte sparas. Försök igen.');
    return { saved: true };
  });
export const deleteWorkout = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from('workouts').delete().eq('id', data.id).eq('user_id', context.userId);
    if (error) throw new Error('Träningen kunde inte tas bort. Försök igen.');
    return { removed: true };
  });
