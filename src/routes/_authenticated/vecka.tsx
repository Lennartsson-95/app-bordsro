import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MealList } from '@/components/meal-list';
import { getWeek } from '@/lib/today.functions';
import { localDay, plannedMeals, shiftDay, weekDays } from '@/lib/meal-plan';
import { profileSchema, trainingLevel } from '@/lib/profile-schema';
import { pageHead } from '@/lib/page-head';
import { guestToday, isGuest } from '@/lib/guest';

const weekQuery = (day: string) => { const days = weekDays(day); return queryOptions({ queryKey: ['week', days[0]], queryFn: () => isGuest() ? guestToday() : getWeek({ data: { start: days[0] ?? day, end: days[6] ?? day } }) }); };
export const Route = createFileRoute('/_authenticated/vecka')({
  head: () => pageHead('Veckoplan – Bordsro', 'Planera veckans måltider med egna maträtter, personliga tider och portionsförslag utan kalorier.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(weekQuery(localDay(new Date()))),
  component: WeekPage,
});
function WeekPage() {
  const [day, setDay] = useState(() => localDay(new Date()));
  const days = weekDays(day);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const { data } = useSuspenseQuery(weekQuery(day));
  const profile = profileSchema.safeParse(data.profile);
  if (!profile.success || !data.profile.completed) return <main className="mx-auto max-w-xl px-6 py-12"><h1 className="font-display text-3xl">Dina måltider börjar med dig</h1><Button asChild className="mt-6"><Link to="/min-profil">Till mina frågor</Link></Button></main>;
  const first = days[0] ?? day;
  const last = days[6] ?? day;
  const format = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
  return <main className="mx-auto max-w-3xl px-5 pb-12 pt-8 sm:px-10 sm:pt-12">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="font-display text-4xl sm:text-5xl">Din vecka</h1><p className="mt-3 text-muted-foreground">{format(first)} – {format(last)}, {new Date(`${first}T12:00:00`).getFullYear()}</p></div><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Föregående vecka" title="Föregående vecka" onClick={() => setDay(shiftDay(day, -7))}><ChevronLeft /></Button><Button variant="outline" onClick={() => setDay(localDay(new Date()))}>Denna vecka</Button><Button variant="outline" size="icon" aria-label="Nästa vecka" title="Nästa vecka" onClick={() => setDay(shiftDay(day, 7))}><ChevronRight /></Button></div></div>
    <div className="mt-8 space-y-3">{days.map(date => { const entries = data.meals.filter(e => e.day === date); const dayWorkouts = (data.workouts ?? []).filter(w => w.day === date); const training = trainingLevel(dayWorkouts); const isToday = date === localDay(new Date()); const meals = plannedMeals(profile.data, entries, training); const isOpen = openDay === date; return <section key={date} aria-label={date} className="rounded-lg border border-border bg-card">
      <button type="button" aria-expanded={isOpen} onClick={() => setOpenDay(isOpen ? null : date)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <span><span className="block font-display text-xl capitalize">{new Date(`${date}T12:00:00`).toLocaleDateString('sv-SE', { weekday: 'long' })}<span className="ml-2 font-sans text-xs text-muted-foreground">{format(date)}</span>{isToday && <span className="ml-2 font-sans text-xs font-medium text-primary">Idag</span>}</span><span className="mt-1 block text-xs text-muted-foreground">{meals.length === 0 ? 'Inga måltider' : meals.map(m => m.label).join(', ')}</span></span>
        <ChevronDown className={`size-5 shrink-0 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="border-t border-border p-4">{dayWorkouts.length > 0 && <p className="mb-3 text-xs text-primary">Träning: {dayWorkouts.map(w => `${w.kind} ${w.minutes} min`).join(', ')}</p>}<MealList day={date} meals={meals} entries={entries} profile={profile.data} training={training} compact /></div>}
    </section>; })}</div>
  </main>;
}