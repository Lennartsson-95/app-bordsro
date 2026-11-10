import { z } from 'zod';
import type { ProfileAnswers } from './profile-schema';

export const slotSchema = z.enum(['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'evening']);
export type MealSlot = z.infer<typeof slotSchema>;
export const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(`${v}T12:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === v; });
export function localDay(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function minutes(time: string) { const [h = 0, m = 0] = time.split(':').map(Number); return h * 60 + m; }
export function clock(total: number) { const normalized = ((Math.round(total) % 1440) + 1440) % 1440; return `${String(Math.floor(normalized/60)).padStart(2,'0')}:${String(normalized%60).padStart(2,'0')}`; }
export type Meal = { slot: MealSlot; label: string; time: string; offset: number; title: string; ingredients: string; portions: string[]; image: 'breakfast' | 'lunch' | null };
export function createMealPlan(profile: ProfileAnswers, choices: Partial<Record<MealSlot, number>> = {}): Meal[] {
  const start = minutes(profile.wake_time) + 30;
  let end = minutes(profile.sleep_time) - 60;
  if (end <= start) end += 1440;
  const extra = profile.goal === 'gain';
  const slots: MealSlot[] = extra ? ['breakfast','snack1','lunch','snack2','dinner','evening'] : ['breakfast','snack1','lunch','snack2','dinner'];
  const vegan = profile.diet === 'vegan';
  const protein = profile.diet === 'mixed' ? 'kyckling' : profile.diet === 'pescatarian' ? 'fisk' : 'bönor';
  return slots.map((slot, index) => {
    const alt = choices[slot] === 1;
    const offset = start + ((end-start)*index/(slots.length-1));
    const main = slot === 'lunch' || slot === 'dinner';
    const carb = profile.goal === 'lose' ? '1 kupad hand' : extra || profile.activity === 'high' ? '2 kupade händer' : '1–2 kupade händer';
    const portions = main ? [`1 handflata ${slot === 'lunch' && !alt ? 'linser' : protein}`, `${carb} ${slot === 'dinner' && !alt ? 'potatis' : 'ris'}`, '2 nävar grönsaker', '1 tumme olja eller annat matfett'] : slot === 'breakfast' ? [extra ? '1 rejäl skål + 1 smörgås' : '1 skål', '1 näve frukt eller bär', vegan ? '1 glas berikad växtdryck' : '1 glas mjölk eller berikad växtdryck'] : [extra ? '1 frukt + 2 smörgåsar med pålägg' : '1 frukt + 1 smörgås med pålägg'];
    const label = { breakfast:'Frukost', snack1:'Förmiddagsmål', lunch:'Lunch', snack2:'Mellanmål', dinner:'Middag', evening:'Kvällsmål' }[slot];
    let title = '', ingredients = '', image: Meal['image'] = null;
    if (slot === 'breakfast') { title = alt ? (vegan ? 'Växtyoghurt med frukt' : 'Yoghurt med frukt') : 'Havregröt med banan & bär'; ingredients = alt ? `${vegan ? 'Berikad växtyoghurt' : 'Yoghurt'}, havreflingor, frukt` : 'Havre, banan, bär, mjölk eller växtdryck'; if (!alt) image = 'breakfast'; }
    else if (slot === 'lunch') { title = alt ? `Ris med ${protein} & grönsaker` : 'Linsgryta med ris & sallad'; ingredients = alt ? `Ris, ${protein}, grönsaker, olja` : 'Linser, ris, morot, zucchini, tomat, sallad, olja'; if (!alt) image = 'lunch'; }
    else if (slot === 'dinner') { title = alt ? `Grönsaksris med ${protein}` : `Ugnspotatis med ${protein} & grönsaker`; ingredients = `${alt ? 'Ris' : 'Potatis'}, ${protein}, grönsaker, olja`; }
    else { title = alt ? 'Frukt & havregröt' : 'Frukt & smörgås'; ingredients = alt ? 'Frukt, havre, mjölk eller växtdryck' : `Frukt, bröd, ${vegan ? 'bönröra' : 'ost eller bönröra'}`; if (alt) portions.splice(0, portions.length, '1 frukt + 1 liten skål havregröt'); }
    return { slot, label, time: clock(offset), offset, title, ingredients, portions, image };
  });
}
export function dueReminders(meals: Meal[], eaten: Set<MealSlot>, nowMinutes: number, lead: number) {
  return meals.filter(meal => !eaten.has(meal.slot) && nowMinutes >= meal.offset - lead && nowMinutes < meal.offset - lead + 2);
}