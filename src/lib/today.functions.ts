import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { workoutSchema } from './profile-schema';
import { daySchema, slotSchema, mealEditSchema, mealChoiceSchema } from './meal-plan';
import { ownShoppingItemSchema } from './shopping-schema';

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
  .inputValidator((input: unknown) => z.object({ day: daySchema, slot: slotSchema, eaten: z.boolean().optional(), choice: mealChoiceSchema.optional() }).refine(v => v.eaten !== undefined || v.choice !== undefined).parse(input))
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
export const setMealAdded = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ day: daySchema, slot: slotSchema, added: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    const row = data.added ? { user_id: context.userId, day: data.day, slot: data.slot, added: true } : { user_id: context.userId, day: data.day, slot: data.slot, added: false, eaten: false, custom_title: null, custom_time: null, choice: 0 };
    const { error } = await context.supabase.from('daily_meals').upsert(row, { onConflict: 'user_id,day,slot', defaultToNull: false });
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
export const getShoppingChecks = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ week: daySchema }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase.from('shopping_checks').select('item').eq('user_id', context.userId).eq('week_start', data.week);
    if (error) throw new Error('Inköpslistan kunde inte hämtas.');
    return rows.map(r => r.item);
  });
export const toggleShoppingCheck = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ week: daySchema, item: z.string().trim().min(1).max(120), checked: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    const res = data.checked
      ? await context.supabase.from('shopping_checks').upsert({ user_id: context.userId, week_start: data.week, item: data.item }, { onConflict: 'user_id,week_start,item', ignoreDuplicates: true })
      : await context.supabase.from('shopping_checks').delete().eq('user_id', context.userId).eq('week_start', data.week).eq('item', data.item);
    if (res.error) throw new Error('Kunde inte spara. Försök igen.');
    return { saved: true };
  });
export const getShoppingItems = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ week: daySchema }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase.from('shopping_items').select('item, quantity').eq('user_id', context.userId).eq('week_start', data.week).order('created_at');
    if (error) throw new Error('Dina egna varor kunde inte hämtas.');
    return rows;
  });
export const addShoppingItem = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ownShoppingItemSchema.extend({ week: daySchema }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from('shopping_items').upsert({ user_id: context.userId, week_start: data.week, item: data.item, quantity: data.quantity }, { onConflict: 'user_id,week_start,item', ignoreDuplicates: true });
    if (error) throw new Error('Varan kunde inte läggas till. Försök igen.');
    return { saved: true };
  });
export const removeShoppingItem = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ week: daySchema, item: z.string().trim().min(1).max(120) }).parse(input))
  .handler(async ({ context, data }) => {
    const [item, check] = await Promise.all([
      context.supabase.from('shopping_items').delete().eq('user_id', context.userId).eq('week_start', data.week).eq('item', data.item),
      context.supabase.from('shopping_checks').delete().eq('user_id', context.userId).eq('week_start', data.week).eq('item', data.item),
    ]);
    if (item.error || check.error) throw new Error('Varan kunde inte tas bort. Försök igen.');
    return { removed: true };
  });
