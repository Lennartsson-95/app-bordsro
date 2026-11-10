import { describe, expect, it } from 'vitest';
import { createMealPlan, dishOptions, dueReminders, localDay, plannedMeals, prepareOwnItem, weekDays, mealEditSchema, proteinGroups } from '@/lib/meal-plan';
import { initialAnswers } from '@/lib/profile-schema';
describe('Meal suggestions', () => {
  it('a newly added meal has no food chosen until the user picks one', () => {
    const [meal] = plannedMeals(initialAnswers, [{ slot: 'lunch', choice: 0, eaten: false, custom_title: null, custom_time: null, added: true, chosen: false }]);
    expect(meal?.title).toBe('Välj mat');
    expect(meal?.ingredients).toBe('');
  });
  it('offers exactly Frukost, Mellanmål, Lunch, Middag and Kvällsmål to add', () => {
    expect(createMealPlan(initialAnswers).map(m => m.label).sort()).toEqual(['Frukost','Kvällsmål','Lunch','Mellanmål','Middag']);
  });
  it('shows only meals the user has added, and none on an empty day', () => {
    expect(plannedMeals(initialAnswers, [])).toEqual([]);
    const meals = plannedMeals(initialAnswers, [{ slot: 'lunch', choice: 0, eaten: false, custom_title: null, custom_time: null, added: true }, { slot: 'dinner', choice: 0, eaten: false, custom_title: null, custom_time: null, added: false }]);
    expect(meals.map(m => m.slot)).toEqual(['lunch']);
  });
  it('uses the selected meal time and own food with a profile-based portion guide', () => {
    const meals = plannedMeals({ ...initialAnswers, goal: 'gain' }, [{ slot: 'lunch', choice: 0, eaten: false, custom_title: 'Pasta med tofu', custom_time: '13:10' }]);
    const lunch = meals.find(m => m.slot === 'lunch');
    expect(lunch?.title).toBe('Pasta med tofu');
    expect(lunch?.time).toBe('13:10');
    expect(lunch?.offset).toBe(790);
    expect(lunch?.portions[1]).toBe('2 kupade händer av ris, pasta, potatis eller motsvarande');
  });
  it('plans a full Monday to Sunday week across month boundaries', () => {
    expect(weekDays('2026-11-01')).toEqual(['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-01']);
  });
  it('rejects invalid edited times', () => {
    expect(mealEditSchema.safeParse({ day: '2026-11-10', slot: 'lunch', custom_title: 'Pasta', custom_time: '25:00' }).success).toBe(false);
  });
  it('offers larger portions for weight gain than weight loss', () => {
    expect(createMealPlan({ ...initialAnswers, goal: 'gain' }).find(m => m.slot === "lunch")?.portions[1]).toBe('2 kupade händer ris');
    expect(createMealPlan({ ...initialAnswers, goal: 'lose' }).find(m => m.slot === "lunch")?.portions[1]).toBe('1 kupad hand ris');
  });
  it('uses more food for an active day', () => {
    expect(createMealPlan({ ...initialAnswers, activity: 'high' }).find(m => m.slot === "lunch")?.portions[1]).toBe('2 kupade händer ris');
  });
  it('uses hand measures instead of calorie or macro data', () => {
    const meals = createMealPlan(initialAnswers);
    expect(meals.find(m => m.slot === "lunch")?.portions[0]).toBe('1 handflata linser');
    expect(JSON.stringify(meals)).not.toMatch(/kcal|calories|macros/i);
  });
  it('does not remind about a meal already eaten', () => {
    const meals = createMealPlan(initialAnswers); const first = meals[0];
    if (!first) throw new Error('Missing breakfast');
    expect(dueReminders(meals,new Set(['breakfast']),first.offset,0)).toHaveLength(0);
    expect(dueReminders(meals,new Set(),first.offset,0).map(m=>m.slot)).toEqual(['breakfast']);
  });
  it('supports fifteen-minute advance reminders', () => {
    const meals = createMealPlan(initialAnswers); const first = meals[0];
    if (!first) throw new Error('Missing breakfast');
    expect(dueReminders(meals,new Set(),first.offset-15,15).map(m=>m.slot)).toEqual(['breakfast']);
    expect(dueReminders(meals,new Set(),first.offset-20,15)).toHaveLength(0);
  });
  it('suggests more food on a hard training day', () => {
    expect(createMealPlan(initialAnswers, {}, 2).find(m => m.slot === "lunch")?.portions[1]).toBe('2 kupade händer ris');
    expect(createMealPlan(initialAnswers, {}, 1).find(m => m.slot === "snack2")?.portions).toContain('Träningsdag: + 1 extra frukt');
  });
  it('suggests more food for a larger body', () => {
    expect(createMealPlan({ ...initialAnswers, weight_kg: 95, height_cm: 180 }).find(m => m.slot === "lunch")?.portions[1]).toBe('2 kupade händer ris');
  });
  it('offers several dishes to choose between for every meal', () => {
    const options = dishOptions(initialAnswers);
    for (const dishes of Object.values(options)) expect(dishes.length).toBeGreaterThanOrEqual(3);
  });
  it('offers varied protein sources for lunch and dinner', () => {
    const options = dishOptions(initialAnswers);
    expect(options.lunch).toHaveLength(11);
    expect(options.dinner).toHaveLength(10);
    expect(options.lunch.slice(0, 8).map(d => d.proteinPart)).toEqual(['linser', 'kyckling', 'kyckling', 'tofu', 'kikärtor', 'lax', 'omelett', 'kalkon']);
    expect(options.dinner.slice(0, 8).map(d => d.proteinPart)).toEqual(['kyckling', 'kyckling', 'kyckling', 'tofu', 'kikärtor', 'torsk', 'halloumi', 'köttbullar']);
  });
  it('keeps the expanded suggestions compatible with each diet', () => {
    for (const diet of ['vegan', 'vegetarian', 'pescatarian'] as const) {
      const dishes = Object.values(dishOptions({ ...initialAnswers, diet })).flat();
      expect(JSON.stringify(dishes)).not.toMatch(/kyckling|kalkon|nötfärs|köttbullar/i);
      if (diet !== 'pescatarian') expect(JSON.stringify(dishes)).not.toMatch(/lax|torsk|fisk/i);
      if (diet === 'vegan') expect(dishes.map(d => d.ingredients).join(', ')).not.toMatch(/ägg|halloumi|keso|kvarg|mjölk|ost eller/i);
    }
  });
  it('derives portions and shopping ingredients from a new protein choice', () => {
    const lunch = createMealPlan(initialAnswers, { lunch: 5 }).find(m => m.slot === 'lunch');
    expect(lunch?.title).toBe('Lax med potatis & broccoli');
    expect(lunch?.portions[0]).toBe('1 handflata lax');
    expect(lunch?.portions[1]).toBe('1–2 kupade händer potatis');
    expect(lunch?.ingredients).toBe('Lax, potatis, broccoli, olja');
    expect(mealEditSchema.safeParse({ day: '2026-11-10', slot: 'lunch', choice: 7, custom_title: null, custom_time: null }).success).toBe(true);
  });
  it('uses the dish the user picked from the suggestions', () => {
    expect(createMealPlan(initialAnswers, { lunch: 2 }).find(m => m.slot === 'lunch')?.title).toBe('Pastasallad med kyckling');
    expect(createMealPlan({ ...initialAnswers, diet: 'vegan' }, { dinner: 1 }).find(m => m.slot === 'dinner')?.title).toBe('Grönsaksris med bönor');
  });
  it('keeps local dates instead of UTC dates', () => {
    expect(localDay(new Date(2026,10,10,0,1))).toBe('2026-11-10');
  });
  it('offers exactly two dishes per vegetarian, fish, meat and chicken category', () => {
    for (const slot of ['lunch', 'dinner'] as const) {
      const groups = proteinGroups(initialAnswers, slot);
      expect(groups.map(g => g.category)).toEqual(['vegetarian', 'fish', 'meat', 'chicken']);
      for (const group of groups) expect(group.dishes).toHaveLength(2);
      expect(groups.find(g => g.category === 'fish')?.dishes.map(d => d.dish.proteinPart).sort()).toEqual(['lax', 'torsk']);
      expect(groups.find(g => g.category === 'chicken')?.dishes.map(d => d.dish.proteinPart)).toEqual(['kyckling', 'kyckling']);
    }
  });
  it('only offers protein categories allowed by the profile diet', () => {
    for (const slot of ['lunch', 'dinner'] as const) {
      expect(proteinGroups({ ...initialAnswers, diet: 'vegan' }, slot).map(g => g.category)).toEqual(['vegetarian']);
      expect(proteinGroups({ ...initialAnswers, diet: 'vegetarian' }, slot).map(g => g.category)).toEqual(['vegetarian']);
      expect(proteinGroups({ ...initialAnswers, diet: 'pescatarian' }, slot).map(g => g.category)).toEqual(['vegetarian', 'fish']);
    }
  });
  it('uses original dish indices when saving a category suggestion', () => {
    const choice = proteinGroups(initialAnswers, 'lunch').find(g => g.category === 'meat')?.dishes[1]?.choice;
    expect(choice).toBe(10);
    const input = { day: '2026-11-10', slot: 'lunch', choice, custom_title: null, custom_time: null };
    expect(mealEditSchema.safeParse(input).success).toBe(true);
    expect(mealEditSchema.safeParse({ ...input, choice: 11 }).success).toBe(false);
    expect(plannedMeals(initialAnswers, [{ slot: 'lunch', choice: choice ?? -1, eaten: false, custom_title: null, custom_time: null }]).find(m => m.slot === 'lunch')?.title).toBe('Köttfärssås med pasta');
  });
});import { shoppingList as _sl } from '@/lib/meal-plan';
describe('inköpslista', () => {
  it('slår ihop samma ingrediens och listar egna rätter', () => {
    const m = (ingredients: string, title = 'x') => ({ slot: 'lunch', label: '', time: '', offset: 0, title, ingredients, portions: [], image: null }) as any;
    const r = _sl([m('Ris, kyckling'), m('ris, olja'), m('', 'Tacos')]);
    expect(r.items).toEqual([{ name: 'Kyckling', count: 1 }, { name: 'Olja', count: 1 }, { name: 'Ris', count: 2 }]);
    expect(r.custom).toEqual(['Tacos']);
  });
  it('renserar en egen vara och stoppar duplikater', () => {
    expect(prepareOwnItem('  ris   och  gryn ', [])).toEqual({ item: 'ris och gryn', duplicate: false });
    expect(prepareOwnItem('Ris', ['ris', 'olja'])).toEqual({ item: 'Ris', duplicate: true });
    expect(prepareOwnItem('   ', []).item).toBe('');
  });
});
