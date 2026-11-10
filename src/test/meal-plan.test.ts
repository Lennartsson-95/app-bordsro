import { describe, expect, it } from 'vitest';
import { createMealPlan, dueReminders, localDay } from '@/lib/meal-plan';
import { initialAnswers } from '@/lib/profile-schema';
describe('Meal suggestions', () => {
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
  it('keeps local dates instead of UTC dates', () => {
    expect(localDay(new Date(2026,10,10,0,1))).toBe('2026-11-10');
  });
});