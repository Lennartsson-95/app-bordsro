import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, Clock, RefreshCw, Save, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { editMeal, updateMeal } from '@/lib/today.functions';
import { dishOptions, mealEditSchema, plannedMeals, type Meal, type MealEntry } from '@/lib/meal-plan';
import type { ProfileAnswers } from '@/lib/profile-schema';
import breakfastImage from '@/assets/frukost-havre.jpg';
import lunchImage from '@/assets/lunch-linser.jpg';

export function MealList({ day, meals, entries, profile, compact = false, training = 0 }: { day: string; meals: Meal[]; entries: MealEntry[]; profile: ProfileAnswers; compact?: boolean; training?: 0 | 1 | 2 }) {
  const [selected, setSelected] = useState<Meal | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [choice, setChoice] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = useServerFn(editMeal);
  const mark = useServerFn(updateMeal);
  const queryClient = useQueryClient();
  const preview = selected ? plannedMeals(profile, [...entries.filter(e => e.slot !== selected.slot), { slot: selected.slot, choice: entries.find(e => e.slot === selected.slot)?.choice ?? 0, eaten: false, custom_title: title.trim() || null, custom_time: null }], training).find(m => m.slot === selected.slot) : null;
  async function refresh() { await Promise.all([queryClient.invalidateQueries({ queryKey: ['today'] }), queryClient.invalidateQueries({ queryKey: ['week'] })]); }
  function open(meal: Meal) { setSelected(meal); const entry = entries.find(e => e.slot === meal.slot); setTitle(entry?.custom_title ?? ''); setTime(meal.time); setChoice(entry?.choice ?? 0); setError(''); }
  async function choose(index: number) {
    if (!selected) return;
    setChoice(index); setTitle(''); setBusy(true); setError('');
    try { await save({ data: { day, slot: selected.slot, custom_title: null, custom_time: time, choice: index } }); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Förslaget kunde inte sparas.'); }
    finally { setBusy(false); }
  }
  async function submit(reset = false) {
    if (!selected) return;
    const result = mealEditSchema.safeParse({ day, slot: selected.slot, custom_title: reset ? null : title.trim() || null, custom_time: reset ? null : time });
    if (!result.success) { setError(result.error.issues[0]?.message ?? 'Kontrollera måltiden.'); return; }
    setBusy(true); setError('');
    try { await save({ data: result.data }); await refresh(); setSelected(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Måltiden kunde inte sparas.'); }
    finally { setBusy(false); }
  }
  async function toggle(meal: Meal) {
    const entry = entries.find(e => e.slot === meal.slot);
    setBusy(true); setError('');
    try { await mark({ data: { day, slot: meal.slot, eaten: !entry?.eaten, choice: entry?.choice ?? 0 } }); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Måltiden kunde inte sparas.'); }
    finally { setBusy(false); }
  }
  return <>
    {!selected && error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
    <div className={compact ? 'space-y-2' : 'space-y-4'}>{meals.map(meal => {
      const done = entries.some(e => e.slot === meal.slot && e.eaten);
      const source = meal.image === 'breakfast' ? breakfastImage : meal.image === 'lunch' ? lunchImage : null;
      return <article key={meal.slot} aria-label={meal.label} className={`overflow-hidden rounded-lg border ${done ? 'border-primary/40 bg-secondary/30' : 'border-border bg-card'}`}>
        <div className="flex items-stretch">
          <Button variant="ghost" className={`h-auto min-w-0 flex-1 justify-start whitespace-normal rounded-none text-left ${compact ? 'gap-3 p-3' : 'gap-4 p-4 sm:p-5'}`} onClick={() => open(meal)} aria-label={`Visa ${meal.label.toLowerCase()}`}>
            {!compact && (source ? <img src={source} alt="" width="72" height="72" className="size-16 shrink-0 rounded-md object-cover sm:size-20" /> : <span className="flex size-16 shrink-0 items-center justify-center rounded-md bg-secondary sm:size-20"><Utensils className="size-6 text-primary" /></span>)}
            <span className="min-w-0 flex-1"><span className="mb-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground"><Clock className="size-3" />{meal.time} · {meal.label}</span><span className={`block break-words font-display ${compact ? 'text-sm' : 'text-lg'}`}>{meal.title}</span>{done && <span className="mt-1 block text-xs text-primary">Uppäten</span>}</span><ChevronRight className="size-4 shrink-0 text-primary" />
          </Button>
          {!compact && <Button size="icon" variant={done ? 'secondary' : 'ghost'} disabled={busy} className="my-auto mr-3 shrink-0" title={done ? 'Ångra uppäten' : 'Jag har ätit'} aria-label={done ? `Ångra uppäten ${meal.label.toLowerCase()}` : `Markera ${meal.label.toLowerCase()} som uppäten`} onClick={() => toggle(meal)}><Check /></Button>}
        </div>
      </article>;
    })}</div>
    <Dialog open={selected !== null} onOpenChange={v => { if (!v && !busy) setSelected(null); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
        <DialogHeader><DialogTitle className="pr-6 font-display text-2xl">{selected?.label}</DialogTitle><DialogDescription>{new Date(`${day}T12:00:00`).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}</DialogDescription></DialogHeader>
        {selected && <><form onSubmit={e => { e.preventDefault(); void submit(); }} className="space-y-4">
          <div><label htmlFor="meal-time" className="mb-2 block text-sm font-medium">Tid för måltiden</label><Input id="meal-time" type="time" required value={time} onChange={e => setTime(e.target.value)} disabled={busy} /></div>
          <div><label htmlFor="meal-food" className="mb-2 block text-sm font-medium">Vad ska du äta?</label><Input id="meal-food" value={title} onChange={e => setTitle(e.target.value)} placeholder={selected.title} maxLength={160} disabled={busy} /></div>
          <section className="border-y border-border py-4"><h3 className="font-display text-lg">Förslag på mängd</h3><ul className="mt-3 space-y-2 text-sm leading-relaxed">{(preview?.portions ?? selected.portions).map(p => <li key={p} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />{p}</li>)}</ul><p className="mt-3 text-xs leading-relaxed text-muted-foreground">{title.trim() ? 'För egen mat gäller en generell portionsguide för måltiden, inte en beräkning av maträtten. ' : ''}Anpassa efter hunger och mättnad. Kontrollera alltid att maten passar dina allergier.</p></section>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap justify-between gap-2"><Button variant="ghost" type="button" disabled={busy} onClick={() => submit(true)}><RefreshCw />Återställ förslag</Button><Button type="submit" disabled={busy}><Save />{busy ? 'Sparar…' : 'Spara måltid'}</Button></div>
        </form></>}
      </DialogContent>
    </Dialog>
  </>;
}