import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { addShoppingItem, getShoppingChecks, getShoppingItems, getWeek, removeShoppingItem, toggleShoppingCheck } from '@/lib/today.functions';
import { localDay, plannedMeals, shiftDay, shoppingList, weekDays } from '@/lib/meal-plan';
import { profileSchema } from '@/lib/profile-schema';
import { pageHead } from '@/lib/page-head';

const weekQuery = (start: string, end: string) => queryOptions({ queryKey: ['week', start], queryFn: () => getWeek({ data: { start, end } }) });
const checksQuery = (week: string) => queryOptions({ queryKey: ['shopping', week], queryFn: () => getShoppingChecks({ data: { week } }) });
const ownItemsQuery = (week: string) => queryOptions({ queryKey: ['shopping-items', week], queryFn: () => getShoppingItems({ data: { week } }) });

export const Route = createFileRoute('/_authenticated/inkop')({
  head: () => pageHead('Inköpslista – Bordsro', 'Alla ingredienser för veckans måltider samlade i en lista du kan bocka av – och egna varor du lägger till själv.'),
  loader: ({ context }) => { const d = weekDays(localDay(new Date())); return Promise.all([context.queryClient.ensureQueryData(weekQuery(d[0]!, d[6]!)), context.queryClient.ensureQueryData(checksQuery(d[0]!)), context.queryClient.ensureQueryData(ownItemsQuery(d[0]!))]); },
  component: ShoppingPage,
});

function ShoppingPage() {
  const [day, setDay] = useState(() => localDay(new Date()));
  const days = weekDays(day); const first = days[0]!; const last = days[6]!;
  const { data } = useSuspenseQuery(weekQuery(first, last));
  const { data: checked } = useSuspenseQuery(checksQuery(first));
  const { data: ownItems } = useSuspenseQuery(ownItemsQuery(first));
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const [note, setNote] = useState('');
  const toggle = useMutation({
    mutationFn: (v: { item: string; checked: boolean }) => toggleShoppingCheck({ data: { week: first, ...v } }),
    onMutate: v => qc.setQueryData<string[]>(['shopping', first], old => v.checked ? [...(old ?? []), v.item] : (old ?? []).filter(i => i !== v.item)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['shopping', first] }),
  });
  const add = useMutation({
    mutationFn: (item: string) => addShoppingItem({ data: { week: first, item } }),
    onMutate: item => qc.setQueryData<string[]>(['shopping-items', first], old => [...(old ?? []), item]),
    onSettled: () => qc.invalidateQueries({ queryKey: ['shopping-items', first] }),
  });
  const remove = useMutation({
    mutationFn: (item: string) => removeShoppingItem({ data: { week: first, item } }),
    onMutate: item => {
      qc.setQueryData<string[]>(['shopping-items', first], old => (old ?? []).filter(i => i !== item));
      qc.setQueryData<string[]>(['shopping', first], old => (old ?? []).filter(i => i !== item));
    },
    onSettled: () => Promise.all([qc.invalidateQueries({ queryKey: ['shopping-items', first] }), qc.invalidateQueries({ queryKey: ['shopping', first] })]),
  });
  const profile = profileSchema.safeParse(data.profile);
  if (!profile.success || !data.profile.completed) return <main className="mx-auto max-w-xl px-6 py-12"><h1 className="font-display text-3xl">Börja med dina frågor</h1><Button asChild className="mt-6"><Link to="/min-profil">Till mina frågor</Link></Button></main>;
  const meals = days.flatMap(date => plannedMeals(profile.data, data.meals.filter(e => e.day === date)));
  const { items, custom } = shoppingList(meals);
  const done = new Set(checked);
  const format = (v: string) => new Date(`${v}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
  const all = [...items.map(i => i.name), ...custom, ...ownItems];
  const bought = all.filter(name => done.has(name)).length;
  const onList = (name: string) => all.some(existing => existing.toLowerCase() === name.toLowerCase());
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const item = draft.trim().replace(/\s+/g, ' ');
    if (!item) return;
    if (onList(item)) { setNote(`${item} finns redan på listan.`); return; }
    setNote(''); setDraft(''); add.mutate(item);
  }
  const row = (item: string, note?: string, removable = false) => <li key={item} className="flex items-center gap-1">
    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-3"><Checkbox checked={done.has(item)} onCheckedChange={c => toggle.mutate({ item, checked: c === true })} /><span className={done.has(item) ? 'text-muted-foreground line-through' : ''}>{item}</span>{note && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{note}</span>}</label>
    {removable && <Button size="icon" variant="ghost" className="shrink-0" aria-label={`Ta bort ${item}`} onClick={() => remove.mutate(item)}><X className="size-4" /></Button>}
  </li>;
  return <main className="mx-auto max-w-2xl px-5 pb-12 pt-8 sm:px-10 sm:pt-12">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="font-display text-4xl sm:text-5xl">Inköpslista</h1><p className="mt-3 text-muted-foreground">{format(first)} – {format(last)} · {bought} av {all.length} handlat</p></div>
      <div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Föregående vecka" onClick={() => setDay(shiftDay(day, -7))}><ChevronLeft /></Button><Button variant="outline" onClick={() => setDay(localDay(new Date()))}>Denna vecka</Button><Button variant="outline" size="icon" aria-label="Nästa vecka" onClick={() => setDay(shiftDay(day, 7))}><ChevronRight /></Button></div></div>
    <p className="mt-6 text-sm text-muted-foreground">Samlad från rätterna i din veckoplan. Mängden beror på hur många du handlar för – portionerna ser du i varje måltid.</p>
    <ul className="mt-4 divide-y divide-border border-y border-border">{items.map(i => row(i.name, i.count > 1 ? `${i.count} måltider` : undefined))}</ul>
    <h2 className="mt-8 font-display text-xl">Egna rätter och dina varor</h2>
    <p className="text-sm text-muted-foreground">Lägg till varorna du behöver till dina egna rätter och bocka av dem när du handlat.</p>
    <form onSubmit={submit} className="mt-4 flex flex-wrap items-start gap-2">
      <div className="min-w-0 flex-1"><label htmlFor="own-item" className="sr-only">Lägg till en vara</label><Input id="own-item" value={draft} onChange={e => { setDraft(e.target.value); setNote(''); }} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} placeholder="T.ex. havregryn, fisk, äpplen" maxLength={120} disabled={add.isPending} /></div>
      <Button type="submit" disabled={!draft.trim() || add.isPending}><Plus />Lägg till</Button>
    </form>
    {note && <p role="alert" className="mt-2 text-sm text-muted-foreground">{note}</p>}
    {add.isError && <p role="alert" className="mt-2 text-sm text-destructive">Varan kunde inte läggas till. Försök igen.</p>}
    <ul className="mt-3 divide-y divide-border border-y border-border">{custom.map(c => row(c, 'egen rätt'))}{ownItems.map(i => row(i, undefined, true))}</ul>
    {custom.length === 0 && ownItems.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Inga egna varor ännu. Skriv in det du behöver ovan.</p>}
  </main>;
}
