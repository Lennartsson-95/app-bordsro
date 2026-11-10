import type { MealSlot } from './meal-plan';

export type AppetiteAlternative = 'protein-drink' | 'drink' | 'smoothie' | 'small-evening-meal';
const alternatives: Record<MealSlot, AppetiteAlternative> = {
  breakfast: 'protein-drink', snack1: 'drink', snack2: 'drink',
  lunch: 'smoothie', dinner: 'smoothie', evening: 'small-evening-meal',
};
const tips: Record<AppetiteAlternative, readonly string[]> = {
  'protein-drink': [
    'Om frukosten känns svår kan du prova en proteindryck och en banan, i din egen takt.',
    'Liten aptit på morgonen? Börja med en proteindryck och ta en liten smörgås när det känns lättare.',
    'Prova en proteindryck till frukost och något litet vid sidan om, till exempel frukt eller rostat bröd.',
  ],
  drink: [
    'Om du inte är hungrig kan ett glas mjölk eller berikad sojadryck vara ett lättare mellanmål.',
    'Svårt att äta mellanmål? Prova drickyoghurt eller ett växtbaserat alternativ.',
    'Prova en liten banandryck med mjölk eller berikad sojadryck när ett mellanmål känns svårt.',
  ],
  smoothie: [
    'Om maten känns svår kan du prova en smoothie med banan, havre och yoghurt eller ett växtbaserat alternativ.',
    'Liten aptit? Prova en smoothie med bär, banan och mjölk eller berikad sojadryck. Ta gärna en liten smörgås till.',
    'Börja med en smoothie om det känns lättare än en hel måltid. Ät gärna lite av maten senare när aptiten kommer.',
  ],
  'small-evening-meal': [
    'Ett litet kvällsmål räcker som start: prova varm mjölk eller berikad sojadryck och en liten smörgås.',
    'Liten aptit på kvällen? Prova lite yoghurt eller ett växtbaserat alternativ med mjuk frukt.',
    'Om kvällsmålet känns svårt kan du prova drickyoghurt och ta något litet att äta när det känns lättare.',
  ],
};
export function appetiteAlternative(slot: MealSlot): AppetiteAlternative { return alternatives[slot]; }
export function appetiteTip(slot: MealSlot, day: string): string {
  const options = tips[appetiteAlternative(slot)];
  const dayNumber = Math.floor(new Date(`${day}T12:00:00Z`).getTime() / 86_400_000);
  const offset = slot === 'dinner' ? 1 : 0;
  const index = Number.isFinite(dayNumber) ? ((dayNumber + offset) % options.length + options.length) % options.length : 0;
  return options[index] ?? options[0] ?? '';
}