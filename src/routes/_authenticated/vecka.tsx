import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MealList } from '@/components/meal-list';
import { getWeek } from '@/lib/today.functions';
import { localDay, plannedMeals, shiftDay, weekDays } from '@/lib/meal-plan';
import { profileSchema, trainingLevel } from '@/lib/profile-schema';
import { pageHead } from '@/lib/page-head';

const weekQuery = (day: string) => { const days = weekDays(day); return queryOptions({ queryKey: ['week', days[0]], queryFn: () => getWeek({ data: { start: days[0] ?? day, end: days[6] ?? day } }) }); };
export const Route = createFileRoute('/_authenticated/vecka')({
  head: () => pageHead('Veckoplan – Bordsro', 'Planera veckans måltider med egna maträtter, personliga tider och portionsförslag utan kalorier.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(weekQuery(localDay(new Date()))),
  component: WeekPage,
});
function WeekPage() {
  const [day, setDay] = useState(() => localDay(new Date()));
  const days = weekDays(day);
  const { data } = useSuspenseQuery(weekQuery(day));
  const profile = profileSchema.safeParse(data.profile);
  if (!profile.success || !data.profile.completed) return <main className="mx-auto max-w-xl px-6 py-12"><h1 className="font-display text-3xl">Dina måltider börjar med dig</h1><Button asChild className="mt-6"><Link to="/min-profil">Till mina frågor</Link></Button></main>;
  const first = days[0] ?? day;
  const last = days[6] ?? day;
  const format = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
  return <main className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-10 sm:pt-12">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="font-display text-4xl sm:text-5xl">Din vecka</h1><p className="mt-3 text-muted-foreground">{format(first)} – {format(last)}, {new Date(`${first}T12:00:00`).getFullYear()}</p></div><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Föregående vecka" title="Föregående vecka" onClick={() => setDay(shiftDay(day, -7))}><ChevronLeft /></Button><Button variant="outline" onClick={() => setDay(localDay(new Date()))}>Denna vecka</Button><Button variant="outline" size="icon" aria-label="Nästa vecka" title="Nästa vecka" onClick={() => setDay(shiftDay(day, 7))}><ChevronRight /></Button></div></div>
    <div className="mt-8 grid gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-3">{days.map(date => { const entries = data.meals.filter(e => e.day === date); const dayWorkouts = data.workouts.filter(w => w.day === date); const training = trainingLevel(dayWorkouts); const isToday = date === localDay(new Date()); return <section key={date} aria-label={date}>
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3"><h2 className="font-display text-xl capitalize">{new Date(`${date}T12:00:00`).toLocaleDateString('sv-SE', { weekday: 'long' })}<span className="ml-2 font-sans text-xs text-muted-foreground">{format(date)}</span></h2>{isToday && <span className="text-xs font-medium text-primary">Idag</span>}</div>
      {dayWorkouts.length > 0 && <p className="mb-3 text-xs text-primary">Träning: {dayWorkouts.map(w => `${w.kind} ${w.minutes} min`).join(', ')}</p>}<MealList day={date} meals={plannedMeals(profile.data, entries, training)} entries={entries} profile={profile.data} training={training} compact />
    </section>; })}</div>
  </main>;
}