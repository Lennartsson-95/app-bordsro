import { describe, expect, it } from 'vitest';
import { createMealPlan, dishOptions, dueReminders, localDay, plannedMeals, weekDays, mealEditSchema } from '@/lib/meal-plan';
import { initialAnswers } from '@/lib/profile-schema';
describe('Meal suggestions', () => {
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
    expect(createMealPlan({ ...initialAnswers, goal: 'gain' })[2]?.portions[1]).toBe('2 kupade händer ris');
    expect(createMealPlan({ ...initialAnswers, goal: 'lose' })[2]?.portions[1]).toBe('1 kupad hand ris');
  });
  it('uses more food for an active day', () => {
    expect(createMealPlan({ ...initialAnswers, activity: 'high' })[2]?.portions[1]).toBe('2 kupade händer ris');
  });
  it('uses hand measures instead of calorie or macro data', () => {
    const meals = createMealPlan(initialAnswers);
    expect(meals[2]?.portions[0]).toBe('1 handflata linser');
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
    expect(createMealPlan(initialAnswers, {}, 2)[2]?.portions[1]).toBe('2 kupade händer ris');
    expect(createMealPlan(initialAnswers, {}, 1)[3]?.portions).toContain('Träningsdag: + 1 extra frukt');
  });
  it('suggests more food for a larger body', () => {
    expect(createMealPlan({ ...initialAnswers, weight_kg: 95, height_cm: 180 })[2]?.portions[1]).toBe('2 kupade händer ris');
  });
  it('offers several dishes to choose between for every meal', () => {
    const options = dishOptions(initialAnswers);
    for (const dishes of Object.values(options)) expect(dishes.length).toBeGreaterThanOrEqual(3);
  });
  it('uses the dish the user picked from the suggestions', () => {
    expect(createMealPlan(initialAnswers, { lunch: 2 }).find(m => m.slot === 'lunch')?.title).toBe('Pastasallad med kyckling');
    expect(createMealPlan({ ...initialAnswers, diet: 'vegan' }, { dinner: 1 }).find(m => m.slot === 'dinner')?.title).toBe('Grönsaksris med bönor');
  });
  it('keeps local dates instead of UTC dates', () => {
    expect(localDay(new Date(2026,10,10,0,1))).toBe('2026-11-10');
  });
});