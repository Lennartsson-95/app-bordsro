import { z } from 'zod';
import type { ProfileAnswers } from './profile-schema';

export const slotSchema = z.enum(['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'evening']);
export type MealSlot = z.infer<typeof slotSchema>;
export const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(`${v}T12:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === v; });
export function localDay(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function minutes(time: string) { const [h = 0, m = 0] = time.split(':').map(Number); return h * 60 + m; }
export function clock(total: number) { const normalized = ((Math.round(total) % 1440) + 1440) % 1440; return `${String(Math.floor(normalized/60)).padStart(2,'0')}:${String(normalized%60).padStart(2,'0')}`; }
export type Meal = { slot: MealSlot; label: string; time: string; offset: number; title: string; ingredients: string; portions: string[]; image: 'breakfast' | 'lunch' | null };
export type MealEntry = { slot: string; choice: number; eaten: boolean; custom_title: string | null; custom_time: string | null };
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Välj en giltig tid.');
export const mealEditSchema = z.object({ day: daySchema, slot: slotSchema, custom_title: z.string().trim().max(160, 'Använd högst 160 tecken.').nullable(), custom_time: timeSchema.nullable() });
export function weekDays(day: string) {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(date); d.setDate(date.getDate() + i); return localDay(d); });
}
export function shiftDay(day: string, amount: number) { const date = new Date(`${day}T12:00:00`); date.setDate(date.getDate() + amount); return localDay(date); }
export type Training = 0 | 1 | 2;
/** Portion step without calories: goal sets the base, then active life, a larger body and training add one step each. */
export function portionLevel(profile: ProfileAnswers, training: Training = 0) {
  const base = profile.goal === 'lose' ? 0 : profile.goal === 'gain' ? 2 : 1;
  const big = (profile.weight_kg ?? 0) >= 90 || (profile.height_cm ?? 0) >= 185 ? 1 : 0;
  return Math.min(3, base + (profile.activity === 'high' ? 1 : 0) + big + (training === 2 ? 1 : 0));
}
export function carbPortion(profile: ProfileAnswers, training: Training = 0) { return ['1 kupad hand', '1–2 kupade händer', '2 kupade händer', '2–3 kupade händer'][portionLevel(profile, training)]!; }
function trainingExtra(slot: MealSlot, training: Training) {
  if (slot !== 'snack2' || !training) return [];
  return [training === 2 ? 'Träningsdag: + 1 extra smörgås och 1 glas mjölk eller växtdryck' : 'Träningsdag: + 1 extra frukt'];
}
export function plannedMeals(profile: ProfileAnswers, entries: MealEntry[], training: Training = 0): Meal[] {
  return createMealPlan(profile, Object.fromEntries(entries.map(entry => [entry.slot, entry.choice])), training).map(meal => {
    const entry = entries.find(e => e.slot === meal.slot);
    const time = entry?.custom_time ?? meal.time;
    let offset = minutes(time);
    if (minutes(profile.sleep_time) < minutes(profile.wake_time) && offset < minutes(profile.wake_time)) offset += 1440;
    if (!entry?.custom_title) return { ...meal, time, offset };
    const main = meal.slot === 'lunch' || meal.slot === 'dinner';
    const portions = main ? [
      '1 handflata av matens proteindel, till exempel fisk, bönor eller tofu',
      `${carbPortion(profile, training)} av ris, pasta, potatis eller motsvarande`,
      '2 nävar grönsaker', '1 tumme olja eller annat matfett',
    ] : meal.slot === 'breakfast' ? [profile.goal === 'gain' ? '1 rejäl skål eller 2 smörgåsar, gärna med pålägg' : '1 skål eller 1–2 smörgåsar med pålägg', '1 näve frukt eller bär'] : [profile.goal === 'gain' ? '1 frukt + 2 smörgåsar med pålägg eller motsvarande' : '1 frukt + 1 smörgås med pålägg eller motsvarande'];
    portions.push(...trainingExtra(meal.slot, training));
    return { ...meal, title: entry.custom_title, ingredients: '', image: null, portions, time, offset };
  }).sort((a, b) => a.offset - b.offset);
}
export function createMealPlan(profile: ProfileAnswers, choices: Partial<Record<MealSlot, number>> = {}, training: Training = 0): Meal[] {
  const start = minutes(profile.wake_time) + 30;
  let end = minutes(profile.sleep_time) - 60;
  if (end <= start) end += 1440;
  const extra = profile.goal === 'gain';
  const slots: MealSlot[] = extra ? ['breakfast','snack1','lunch','snack2','dinner','evening'] : ['breakfast','snack1','lunch','snack2','dinner'];
  const vegan = profile.diet === 'vegan';
  const protein = profile.diet === 'mixed' ? 'kyckling' : profile.diet === 'pescatarian' ? 'fisk' : 'bönor';
  return slots.map((slot, index) => {
    const alt = choices[slot] === 1;
    const offset = Math.round((start + ((end-start)*index/(slots.length-1))) / 5) * 5;
    const main = slot === 'lunch' || slot === 'dinner';
    const carb = carbPortion(profile, training);
    const portions = main ? [`1 handflata ${slot === 'lunch' && !alt ? 'linser' : protein}`, `${carb} ${slot === 'dinner' && !alt ? 'potatis' : 'ris'}`, '2 nävar grönsaker', '1 tumme olja eller annat matfett'] : slot === 'breakfast' ? [extra ? '1 rejäl skål + 1 smörgås' : '1 skål', '1 näve frukt eller bär', vegan ? '1 glas berikad växtdryck' : '1 glas mjölk eller berikad växtdryck'] : [extra ? '1 frukt + 2 smörgåsar med pålägg' : '1 frukt + 1 smörgås med pålägg'];
    const label = { breakfast:'Frukost', snack1:'Förmiddagsmål', lunch:'Lunch', snack2:'Mellanmål', dinner:'Middag', evening:'Kvällsmål' }[slot];
    let title = '', ingredients = '', image: Meal['image'] = null;
    if (slot === 'breakfast') { title = alt ? (vegan ? 'Växtyoghurt med frukt' : 'Yoghurt med frukt') : 'Havregröt med banan & bär'; ingredients = alt ? `${vegan ? 'Berikad växtyoghurt' : 'Yoghurt'}, havreflingor, frukt` : `Havre, banan, bär, ${vegan ? 'berikad växtdryck' : 'mjölk eller växtdryck'}`; if (!alt) image = 'breakfast'; }
    else if (slot === 'lunch') { title = alt ? `Ris med ${protein} & grönsaker` : 'Linsgryta med ris & sallad'; ingredients = alt ? `Ris, ${protein}, grönsaker, olja` : 'Linser, ris, morot, zucchini, tomat, sallad, olja'; if (!alt) image = 'lunch'; }
    else if (slot === 'dinner') { title = alt ? `Grönsaksris med ${protein}` : `Ugnspotatis med ${protein} & grönsaker`; ingredients = `${alt ? 'Ris' : 'Potatis'}, ${protein}, grönsaker, olja`; }
    else { title = alt ? 'Frukt & havregröt' : 'Frukt & smörgås'; ingredients = alt ? `Frukt, havre, ${vegan ? 'berikad växtdryck' : 'mjölk eller växtdryck'}` : `Frukt, bröd, ${vegan ? 'bönröra' : 'ost eller bönröra'}`; if (alt) portions.splice(0, portions.length, '1 frukt + 1 liten skål havregröt'); }
    portions.push(...trainingExtra(slot, training));
    return { slot, label, time: clock(offset), offset, title, ingredients, portions, image };
  });
}
export function dueReminders(meals: Meal[], eaten: Set<MealSlot>, nowMinutes: number, lead: number) {
  return meals.filter(meal => !eaten.has(meal.slot) && nowMinutes >= meal.offset - lead && nowMinutes < meal.offset - lead + 2);
}