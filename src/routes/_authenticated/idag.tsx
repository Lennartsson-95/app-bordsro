import { useEffect, useRef, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Bell, BellRing, Check, Leaf, Utensils, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pageHead } from '@/lib/page-head';
import { getToday, updateReminders } from '@/lib/today.functions';
import { plannedMeals, dueReminders, localDay, minutes, type MealSlot } from '@/lib/meal-plan';
import { goalChoices, profileSchema } from '@/lib/profile-schema';
import { MealList } from '@/components/meal-list';

const todayQuery = (day: string) => queryOptions({ queryKey: ['today',day], queryFn: () => getToday({ data: { day } }) });
export const Route = createFileRoute('/_authenticated/idag')({
  head: () => pageHead('Idag – Bordsro', 'Dagens måltider, portionsförslag i handmått och dina måltidspåminnelser.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(todayQuery(localDay(new Date()))),
  component: TodayPage,
});
function TodayPage() {
  const [now, setNow] = useState(() => new Date());
  const day = localDay(now);
  const { data } = useSuspenseQuery(todayQuery(day));
  const queryClient = useQueryClient();
  const saveReminders = useServerFn(updateReminders);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [reminder, setReminder] = useState<{ label: string; title: string } | null>(null);
  const reminded = useRef(new Set<string>());
  const profile = profileSchema.safeParse(data.profile);
  const meals = profile.success ? plannedMeals(profile.data, data.meals) : [];
  const eaten = new Set(data.meals.filter(m=>m.eaten).map(m=>m.slot as MealSlot));
  const next = meals.find(m => !eaten.has(m.slot) && m.offset >= now.getHours()*60+now.getMinutes()) ?? meals.find(m=>!eaten.has(m.slot));
  useEffect(() => { const timer = window.setInterval(()=>setNow(new Date()),15000); return ()=>window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!data.profile.reminders_enabled) return;
    let current = now.getHours()*60+now.getMinutes();
    if (current < minutes(data.profile.wake_time) && minutes(data.profile.sleep_time) < minutes(data.profile.wake_time)) current += 1440;
    for (const meal of dueReminders(meals,eaten,current,data.profile.reminder_lead)) {
      const key = `${day}:${meal.slot}`;
      if (reminded.current.has(key)) continue;
      reminded.current.add(key); setReminder({ label:meal.label, title:meal.title });
    }
  }, [now, day, data.profile.reminders_enabled, data.profile.reminder_lead, data.profile.wake_time, data.profile.sleep_time, meals, eaten]);
  async function settings(enabled: boolean, lead: 0 | 5 | 15) {
    setError(''); setBusy('settings');
    try { await saveReminders({ data:{ enabled,lead } }); await queryClient.invalidateQueries({ queryKey:['today'] }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Inställningen kunde inte sparas.'); }
    finally { setBusy(null); }
  }
  if (!profile.success || !data.profile.completed) return <main className="mx-auto max-w-xl px-6 py-12"><h1 className="font-display text-4xl">Dina måltider börjar med dig</h1><p className="mt-4 text-muted-foreground">Besvara frågorna om dina matvanor och din vardag först.</p><Button asChild className="mt-6"><Link to="/min-profil">Till mina frågor</Link></Button></main>;
  const goal = goalChoices.find(g=>g.value===profile.data.goal);
  return <main className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-10 sm:pt-12">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 text-sm capitalize text-muted-foreground">{now.toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'})}</p><h1 className="font-display text-4xl sm:text-5xl">Idag, {data.profile.display_name}</h1><p className="mt-3 text-muted-foreground">En måltid i taget.</p></div><div className="flex items-center gap-2 text-sm text-primary"><Leaf className="size-4" />{goal?.title}</div></div>
    {reminder && <div role="alert" className="mt-6 flex items-start gap-3 rounded-md border border-primary bg-secondary p-5"><BellRing className="mt-1 shrink-0 text-primary" /><div className="flex-1"><p className="font-semibold">Dags för {reminder.label.toLowerCase()}</p><p className="mt-1 text-sm">{reminder.title}</p></div><Button variant="ghost" size="icon" title="Stäng påminnelsen" aria-label="Stäng påminnelsen" onClick={()=>setReminder(null)}><X /></Button></div>}
    {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
    <div className="mt-6"><Button variant="outline" asChild><Link to="/vecka">Planera veckan</Link></Button></div>
    <div className="mt-9 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div>
        <section className="flex flex-wrap items-center justify-between gap-5 border-y border-border py-5"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary"><Utensils className="size-5" /></span><div><p className="font-medium">{next ? `Nästa måltid · ${next.time}` : 'Dagens måltider är avbockade'}</p><p className="mt-1 text-sm text-muted-foreground">{next?.label ?? 'Ta en lugn stund för dig själv.'}</p></div></div><div className="flex items-center gap-2 text-sm text-primary"><Check className="size-4" />{eaten.size} av {meals.length} måltider</div></section>
        <div className="mt-8"><MealList day={day} meals={meals} entries={data.meals} profile={profile.data} /></div>
      </div>
      <aside className="space-y-8 lg:sticky lg:top-6">
        <section className="border-y border-border py-6"><div className="flex items-center justify-between gap-4"><h2 className="flex items-center gap-2 font-display text-xl"><Bell className="size-5 text-primary" />Påminnelser</h2><Switch aria-label="Aktivera måltidspåminnelser" checked={data.profile.reminders_enabled} disabled={busy!==null} onCheckedChange={v=>settings(v,data.profile.reminder_lead as 0|5|15)} /></div><p className="mb-4 mt-3 text-sm leading-relaxed text-muted-foreground">Påminnelser visas här medan Idag-sidan är öppen. De kommer inte när appen är stängd.</p><label className="mb-2 block text-xs font-medium" id="reminder-lead-label">När vill du bli påmind?</label><Select value={String(data.profile.reminder_lead)} disabled={busy!==null} onValueChange={v=>{ const lead=Number(v); if (lead===0 || lead===5 || lead===15) void settings(data.profile.reminders_enabled,lead); }}><SelectTrigger aria-labelledby="reminder-lead-label"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">Vid måltiden</SelectItem><SelectItem value="5">5 minuter innan</SelectItem><SelectItem value="15">15 minuter innan</SelectItem></SelectContent></Select><Button variant="outline" className="mt-4 w-full" onClick={()=>setReminder({label:'måltiden',title:'En lugn stund att äta något gott.'})}><BellRing />Testa påminnelse</Button></section>
        <section><h2 className="font-display text-xl">Lagom för dig</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Handmåtten är en startpunkt. Anpassa mängden efter hunger, mättnad och hur du mår.</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{profile.data.goal==='gain' ? 'Ditt förslag innehåller större portioner och ett extra kvällsmål.' : profile.data.activity==='high' ? 'Din aktiva vardag ger lite större portioner av ris och potatis.' : 'En jämn måltidsrytm ger plats för både huvudmål och mellanmål.'}</p></section>
        <section className="border-t border-border pt-6"><h2 className="font-display text-xl">Allergier & omtanke</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{data.profile.allergies ? `Du har angett: ${data.profile.allergies}. ` : ''}Förslagen är inte allergisäkrade. Kontrollera ingredienser och välj det du tål.</p><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Vid sjukdom, ofrivillig viktförändring eller svårigheter med mat: prata med vården eller en dietist.</p></section>
      </aside>
    </div>
  </main>;
}