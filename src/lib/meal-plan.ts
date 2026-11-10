import { z } from 'zod';
import type { ProfileAnswers } from './profile-schema';

export const slotSchema = z.enum(['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'evening']);
export type MealSlot = z.infer<typeof slotSchema>;
export const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(`${v}T12:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === v; });
export function localDay(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function minutes(time: string) { const [h = 0, m = 0] = time.split(':').map(Number); return h * 60 + m; }
export function clock(total: number) { const normalized = ((Math.round(total) % 1440) + 1440) % 1440; return `${String(Math.floor(normalized/60)).padStart(2,'0')}:${String(normalized%60).padStart(2,'0')}`; }
export type Meal = { slot: MealSlot; label: string; time: string; offset: number; title: string; ingredients: string; portions: string[]; image: 'breakfast' | 'lunch' | null };
export type MealEntry = { slot: string; choice: number; eaten: boolean; custom_title: string | null; custom_time: string | null; added?: boolean };
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Välj en giltig tid.');
export const mealChoiceSchema = z.number().int().min(0).max(10);
export const mealEditSchema = z.object({ day: daySchema, slot: slotSchema, custom_title: z.string().trim().max(160, 'Använd högst 160 tecken.').nullable(), custom_time: timeSchema.nullable(), choice: mealChoiceSchema.optional() });
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
export function carbPortion(profile: ProfileAnswers, training: Training = 0) { return ['1 kupad hand', '1–2 kupade händer', '2 kupade händer', '2–3 kupade händer'][portionLevel(profile, training)] ?? '1–2 kupade händer'; }
function trainingExtra(slot: MealSlot, training: Training) {
  if (slot !== 'snack2' || !training) return [];
  return [training === 2 ? 'Träningsdag: + 1 extra smörgås och 1 glas mjölk eller växtdryck' : 'Träningsdag: + 1 extra frukt'];
}
export type Dish = { title: string; ingredients: string; image: Meal['image']; proteinPart?: string; carbPart?: string; portions?: string[] };
/** The dishes the user can choose between for each meal slot, adapted to diet. */
export function dishOptions(profile: ProfileAnswers): Record<MealSlot, Dish[]> {
  const vegan = profile.diet === 'vegan';
  const protein = profile.diet === 'mixed' ? 'kyckling' : profile.diet === 'pescatarian' ? 'fisk' : 'bönor';
  const drink = vegan ? 'berikad växtdryck' : 'mjölk eller växtdryck';
  const fish = profile.diet === 'mixed' || profile.diet === 'pescatarian';
  const variedLunches: Dish[] = [
    { title: 'Tofuwok med nudlar', ingredients: 'Tofu, nudlar, broccoli, morot, olja', image: null, proteinPart: 'tofu', carbPart: 'nudlar' },
    { title: 'Kikärtssallad med bulgur', ingredients: 'Kikärtor, bulgur, gurka, tomat, sallad, olja', image: null, proteinPart: 'kikärtor', carbPart: 'bulgur' },
    { title: fish ? 'Lax med potatis & broccoli' : 'Linsbiffar med potatis & broccoli', ingredients: `${fish ? 'Lax' : 'Linser'}, potatis, broccoli, olja`, image: null, proteinPart: fish ? 'lax' : 'linsbiffar', carbPart: 'potatis' },
    { title: vegan ? 'Bönröra på toast med sallad' : 'Omelett med bröd & sallad', ingredients: `${vegan ? 'Bönor' : 'Ägg'}, bröd, tomat, sallad, olja`, image: null, proteinPart: vegan ? 'bönröra' : 'omelett', carbPart: 'bröd' },
    { title: profile.diet === 'mixed' ? 'Kalkon med couscous & grönsaker' : 'Tofu med couscous & grönsaker', ingredients: `${profile.diet === 'mixed' ? 'Kalkon' : 'Tofu'}, couscous, paprika, zucchini, olja`, image: null, proteinPart: profile.diet === 'mixed' ? 'kalkon' : 'tofu', carbPart: 'couscous' },
  ];
  const variedDinners: Dish[] = [
    { title: 'Tofu med ris & broccoli', ingredients: 'Tofu, ris, broccoli, morot, olja', image: null, proteinPart: 'tofu', carbPart: 'ris' },
    { title: 'Kikärtsgryta med bulgur', ingredients: 'Kikärtor, bulgur, tomat, spenat, olja', image: null, proteinPart: 'kikärtor', carbPart: 'bulgur' },
    { title: fish ? 'Torsk med potatis & ärtor' : 'Linsgryta med potatis & ärtor', ingredients: `${fish ? 'Torsk' : 'Linser'}, potatis, ärtor, morot, olja`, image: null, proteinPart: fish ? 'torsk' : 'linser', carbPart: 'potatis' },
    { title: vegan ? 'Böntacos med grönsaker' : 'Halloumi med couscous & grönsaker', ingredients: vegan ? 'Bönor, tortillabröd, tomat, sallad, avokado' : 'Halloumi, couscous, paprika, zucchini, olja', image: null, proteinPart: vegan ? 'bönor' : 'halloumi', carbPart: vegan ? 'tortillabröd' : 'couscous' },
    { title: profile.diet === 'mixed' ? 'Köttbullar med potatis & gröna ärtor' : 'Bönbiffar med potatis & gröna ärtor', ingredients: `${profile.diet === 'mixed' ? 'Nötfärs' : 'Bönor'}, potatis, ärtor, morot, olja`, image: null, proteinPart: profile.diet === 'mixed' ? 'köttbullar' : 'bönbiffar', carbPart: 'potatis' },
  ];
  const snacks: Dish[] = [
    { title: 'Frukt & smörgås', ingredients: `Frukt, bröd, ${vegan ? 'bönröra' : 'ost eller bönröra'}`, image: null },
    { title: 'Frukt & havregröt', ingredients: `Frukt, havre, ${drink}`, image: null, portions: ['1 frukt + 1 liten skål havregröt'] },
    { title: 'Smoothie med frukt & bär', ingredients: `Frukt, bär, ${drink}`, image: null },
    { title: vegan ? 'Växtyoghurt med bär & nötter' : 'Kvarg med bär & nötter', ingredients: `${vegan ? 'Berikad växtyoghurt' : 'Kvarg'}, bär, nötter`, image: null, portions: ['1 liten skål', '1 näve bär', '1 liten näve nötter'] },
    { title: 'Hummussmörgås med gurka', ingredients: 'Bröd, kikärtor, tahini, gurka', image: null, portions: [profile.goal === 'gain' ? '2 smörgåsar med hummus' : '1 smörgås med hummus', '1 näve gurka'] },
    { title: vegan ? 'Smörgås med tofu & paprika' : 'Äggsmörgås med paprika', ingredients: `Bröd, ${vegan ? 'tofu' : 'ägg'}, paprika`, image: null, portions: [profile.goal === 'gain' ? `2 smörgåsar med ${vegan ? 'tofu' : 'ägg'}` : `1 smörgås med ${vegan ? 'tofu' : 'ägg'}`, '1 näve paprika'] },
  ];
  return {
    breakfast: [
      { title: 'Havregröt med banan & bär', ingredients: `Havre, banan, bär, ${drink}`, image: 'breakfast' },
      { title: vegan ? 'Växtyoghurt med frukt' : 'Yoghurt med frukt', ingredients: `${vegan ? 'Berikad växtyoghurt' : 'Yoghurt'}, havreflingor, frukt`, image: null },
      { title: 'Smörgåsar med pålägg', ingredients: `Bröd, ${vegan ? 'bönröra' : 'ost eller bönröra'}, paprika eller gurka`, image: null },
      { title: vegan ? 'Tofuröra med toast & tomat' : 'Äggröra med toast & tomat', ingredients: `${vegan ? 'Tofu' : 'Ägg'}, bröd, tomat, olja`, image: null, portions: [`1 handflata ${vegan ? 'tofuröra' : 'äggröra'}`, profile.goal === 'gain' ? '2 skivor bröd' : '1–2 skivor bröd', '1 näve tomat'] },
      { title: vegan ? 'Sojayoghurt med havre & bär' : 'Keso med havre & bär', ingredients: `${vegan ? 'Berikad sojayoghurt' : 'Keso'}, havre, bär`, image: null },
      { title: 'Hummustoast med avokado', ingredients: 'Bröd, kikärtor, tahini, avokado, tomat', image: null, portions: [profile.goal === 'gain' ? '2 smörgåsar med hummus' : '1–2 smörgåsar med hummus', 'En halv avokado', '1 näve tomat'] },
    ],
    snack1: snacks,
    lunch: [
      { title: 'Linsgryta med ris & sallad', ingredients: 'Linser, ris, morot, zucchini, tomat, sallad, olja', image: 'lunch', proteinPart: 'linser', carbPart: 'ris' },
      { title: `Ris med ${protein} & grönsaker`, ingredients: `Ris, ${protein}, grönsaker, olja`, image: null, proteinPart: protein, carbPart: 'ris' },
      { title: `Pastasallad med ${protein}`, ingredients: `Pasta, ${protein}, grönsaker, olja`, image: null, proteinPart: protein, carbPart: 'pasta' },
      ...variedLunches,
      ...(fish ? [{ title: 'Torsk med ris & ärtor', ingredients: 'Torsk, ris, ärtor, morot, olja', image: null, proteinPart: 'torsk', carbPart: 'ris' } satisfies Dish] : []),
      ...(profile.diet === 'mixed' ? [
        { title: 'Köttbullar med potatis & ärtor', ingredients: 'Nötfärs, potatis, ärtor, morot, olja', image: null, proteinPart: 'köttbullar', carbPart: 'potatis' },
        { title: 'Köttfärssås med pasta', ingredients: 'Nötfärs, pasta, tomat, morot, olja', image: null, proteinPart: 'köttfärssås', carbPart: 'pasta' },
      ] satisfies Dish[] : []),
    ],
    snack2: snacks,
    dinner: [
      { title: `Ugnspotatis med ${protein} & grönsaker`, ingredients: `Potatis, ${protein}, grönsaker, olja`, image: null, proteinPart: protein, carbPart: 'potatis' },
      { title: `Grönsaksris med ${protein}`, ingredients: `Ris, ${protein}, grönsaker, olja`, image: null, proteinPart: protein, carbPart: 'ris' },
      { title: `Gryta med ${protein} & potatis`, ingredients: `${protein}, potatis, rotfrukter, tomat`, image: null, proteinPart: protein, carbPart: 'potatis' },
      ...variedDinners,
      ...(fish ? [{ title: 'Lax med ris & broccoli', ingredients: 'Lax, ris, broccoli, olja', image: null, proteinPart: 'lax', carbPart: 'ris' } satisfies Dish] : []),
      ...(profile.diet === 'mixed' ? [{ title: 'Köttfärsgryta med ris', ingredients: 'Nötfärs, ris, tomat, paprika, olja', image: null, proteinPart: 'köttfärs', carbPart: 'ris' } satisfies Dish] : []),
    ],
    evening: snacks,
  };
}
export type ProteinCategory = 'vegetarian' | 'fish' | 'meat' | 'chicken';
export type ProteinGroup = { category: ProteinCategory; label: string; dishes: { dish: Dish; choice: number }[] };
/** Keep persisted dish indices stable; category filtering never renumbers choices. */
export function proteinGroups(profile: ProfileAnswers, slot: MealSlot): ProteinGroup[] {
  if (slot !== 'lunch' && slot !== 'dinner') return [];
  const dishes = dishOptions(profile)[slot];
  const groups: { category: ProteinCategory; label: string; indices: number[] }[] = [
    { category: 'vegetarian', label: profile.diet === 'vegan' ? 'Veganskt' : 'Vegetariskt', indices: slot === 'lunch' ? [0, 3] : [3, 4] },
  ];
  if (profile.diet === 'mixed' || profile.diet === 'pescatarian') groups.push({ category: 'fish', label: 'Fisk', indices: [5, 8] });
  if (profile.diet === 'mixed') groups.push(
    { category: 'meat', label: 'Kött', indices: slot === 'lunch' ? [9, 10] : [7, 9] },
    { category: 'chicken', label: 'Kyckling', indices: slot === 'lunch' ? [1, 2] : [0, 1] },
  );
  return groups.map(({ indices, ...group }) => ({ ...group, dishes: indices.flatMap(choice => { const dish = dishes[choice]; return dish ? [{ dish, choice }] : []; }) }));
}
export function plannedMeals(profile: ProfileAnswers, entries: MealEntry[], training: Training = 0): Meal[] {
  return createMealPlan(profile, Object.fromEntries(entries.map(entry => [entry.slot, entry.choice])), training).filter(meal => entries.some(e => e.slot === meal.slot && e.added !== false)).map(meal => {
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
  const slots: MealSlot[] = ['breakfast','lunch','snack2','dinner','evening'];
  const options = dishOptions(profile);
  return slots.map((slot, index) => {
    const dishes = options[slot];
    const dish = dishes[Math.min(Math.max(choices[slot] ?? 0, 0), dishes.length - 1)];
    if (!dish) throw new Error('Måltidsförslag saknas.');
    const offset = Math.round((start + ((end-start)*index/(slots.length-1))) / 5) * 5;
    const main = slot === 'lunch' || slot === 'dinner';
    const carb = carbPortion(profile, training);
    let portions = main
      ? [`1 handflata ${dish.proteinPart ?? 'protein'}`, `${carb} ${dish.carbPart ?? 'ris'}`, '2 nävar grönsaker', '1 tumme olja eller annat matfett']
      : slot === 'breakfast'
        ? [extra ? '1 rejäl skål + 1 smörgås' : '1 skål', '1 näve frukt eller bär', `1 glas ${veganDrink(profile)}`]
        : [extra ? '1 frukt + 2 smörgåsar med pålägg' : '1 frukt + 1 smörgås med pålägg'];
    if (dish.portions) portions = [...dish.portions];
    const label = { breakfast:'Frukost', snack1:'Förmiddagsmål', lunch:'Lunch', snack2:'Mellanmål', dinner:'Middag', evening:'Kvällsmål' }[slot];
    portions.push(...trainingExtra(slot, training));
    return { slot, label, time: clock(offset), offset, title: dish.title, ingredients: dish.ingredients, portions, image: dish.image };
  });
}
function veganDrink(profile: ProfileAnswers) { return profile.diet === 'vegan' ? 'berikad växtdryck' : 'mjölk eller berikad växtdryck'; }
export function dueReminders(meals: Meal[], eaten: Set<MealSlot>, nowMinutes: number, lead: number) {
  return meals.filter(meal => !eaten.has(meal.slot) && nowMinutes >= meal.offset - lead && nowMinutes < meal.offset - lead + 2);
}
/** Normalizes a shopping item the user types in and reports whether it is already on the list. */
export function prepareOwnItem(name: string, existing: string[]) {
  const item = name.trim().replace(/\s+/g, ' ').slice(0, 120);
  return { item, duplicate: existing.some(e => e.toLowerCase() === item.toLowerCase()) };
}
export type ShoppingItem = { name: string; count: number };
/** Collects unique ingredients from planned meals; custom dishes without ingredients are listed by name. */
export function shoppingList(meals: Meal[]): { items: ShoppingItem[]; custom: string[] } {
  const map = new Map<string, ShoppingItem>();
  const custom = new Set<string>();
  for (const meal of meals) {
    if (!meal.ingredients) { custom.add(meal.title); continue; }
    for (const raw of meal.ingredients.split(',')) {
      const part = raw.trim(); if (!part) continue;
      const name = part.charAt(0).toUpperCase() + part.slice(1);
      const key = name.toLowerCase();
      const hit = map.get(key); if (hit) hit.count++; else map.set(key, { name, count: 1 });
    }
  }
  return { items: [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'sv')), custom: [...custom] };
}
