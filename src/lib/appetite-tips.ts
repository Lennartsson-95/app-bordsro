import type { MealSlot } from './meal-plan';

export type AppetiteAlternative = 'protein-drink' | 'drink' | 'smoothie' | 'small-evening-meal';
const alternatives: Record<MealSlot, AppetiteAlternative> = {
  breakfast: 'protein-drink', snack1: 'drink', snack2: 'drink',
  lunch: 'smoothie', dinner: 'smoothie', evening: 'small-evening-meal',
};
const tips: Record<AppetiteAlternative, readonly string[]> = {
  'protein-drink': [
    'Om du saknar aptit eller inte orkar äta frukosten kan en proteindryck vara ett alternativ. Ät gärna något litet till om du orkar.',
    'Om du inte har aptit på morgonen kan du ta en proteindryck istället för frukosten och äta något när det känns lättare.',
    'Om du inte orkar äta frukosten kan du prova en proteindryck. Ta gärna lite frukt eller rostat bröd till om det går.',
  ],
  drink: [
    'Om du saknar aptit eller inte orkar äta mellanmålet kan ett glas mjölk eller berikad sojadryck vara ett alternativ.',
    'Svårt att äta mellanmål? Prova drickyoghurt eller ett växtbaserat alternativ.',
    'Prova en liten banandryck med mjölk eller berikad sojadryck när ett mellanmål känns svårt.',
  ],
  smoothie: [
    'Om du saknar aptit eller inte orkar äta måltiden kan en smoothie med banan, havre och yoghurt eller ett växtbaserat alternativ vara ett alternativ.',
    'Om du inte har aptit kan du ta en smoothie med bär, banan och mjölk eller berikad sojadryck istället. Ät gärna något litet till om du orkar.',
    'Om du saknar aptit eller inte orkar äta kan du ta en smoothie istället för måltiden. Ät gärna lite av maten senare när aptiten kommer.',
  ],
  'small-evening-meal': [
    'Om du inte orkar äta kvällsmålet kan varm mjölk eller berikad sojadryck vara ett alternativ. Ta gärna en liten smörgås till om du orkar.',
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