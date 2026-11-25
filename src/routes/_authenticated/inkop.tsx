import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { addShoppingItem, getShoppingChecks, getShoppingItems, getWeek, removeShoppingItem, toggleShoppingCheck } from '@/lib/today.functions';
import { localDay, plannedMeals, prepareOwnItem, shiftDay, shoppingList, weekDays } from '@/lib/meal-plan';
import { profileSchema } from '@/lib/profile-schema';
import { pageHead } from '@/lib/page-head';
import { ownShoppingItemSchema, type OwnShoppingItem } from '@/lib/shopping-schema';
import { guestToday, isGuest, GUEST_SAVE_MESSAGE } from '@/lib/guest';

const weekQuery = (start: string, end: string) => queryOptions({ queryKey: ['week', start], queryFn: () => isGuest() ? guestToday() : getWeek({ data: { start, end } }) });
const checksQuery = (week: string) => queryOptions({ queryKey: ['shopping', week], queryFn: () => isGuest() ? [] as string[] : getShoppingChecks({ data: { week } }) });
const ownItemsQuery = (week: string) => queryOptions({ queryKey: ['shopping-items', week], queryFn: () => isGuest() ? [] as OwnShoppingItem[] : getShoppingItems({ data: { week } }) });

export const Route = createFileRoute('/_authenticated/inkop')({
  head: () => pageHead('Inköpslista – Bordsro', 'Alla ingredienser för veckans måltider samlade i en lista du kan bocka av – och egna varor du lägger till själv.'),
  loader: ({ context }) => { const d = weekDays(localDay(new Date())); const first = d[0]; const last = d[6]; if (!first || !last) throw new Error('Veckan kunde inte hämtas.'); return Promise.all([context.queryClient.ensureQueryData(weekQuery(first, last)), context.queryClient.ensureQueryData(checksQuery(first)), context.queryClient.ensureQueryData(ownItemsQuery(first))]); },
  component: ShoppingPage,
});

function ShoppingPage() {
  const [day, setDay] = useState(() => localDay(new Date()));
  const days = weekDays(day); const first = days[0] ?? day; const last = days[6] ?? day;
  const { data } = useSuspenseQuery(weekQuery(first, last));
  const { data: checked } = useSuspenseQuery(checksQuery(first));
  const { data: ownItems } = useSuspenseQuery(ownItemsQuery(first));
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const guest = isGuest();
  const toggle = useMutation({
    mutationFn: (v: { item: string; checked: boolean }) => guest ? Promise.reject(new Error(GUEST_SAVE_MESSAGE)) : toggleShoppingCheck({ data: { week: first, ...v } }),
    onMutate: v => qc.setQueryData<string[]>(['shopping', first], old => v.checked ? [...(old ?? []), v.item] : (old ?? []).filter(i => i !== v.item)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['shopping', first] }),
  });
  const add = useMutation({
    mutationFn: (item: OwnShoppingItem) => addShoppingItem({ data: { week: first, ...item } }),
    onSuccess: () => { setDraft(''); setQuantity(''); },
    onSettled: () => qc.invalidateQueries({ queryKey: ['shopping-items', first] }),
  });
  const remove = useMutation({
    mutationFn: (item: string) => removeShoppingItem({ data: { week: first, item } }),
    onMutate: item => {
      qc.setQueryData<OwnShoppingItem[]>(['shopping-items', first], old => (old ?? []).filter(i => i.item !== item));
      qc.setQueryData<string[]>(['shopping', first], old => (old ?? []).filter(i => i !== item));
    },
    onSettled: () => Promise.all([qc.invalidateQueries({ queryKey: ['shopping-items', first] }), qc.invalidateQueries({ queryKey: ['shopping', first] })]),
  });
  const profile = profileSchema.safeParse(data.profile);
  if (!profile.success || !data.profile.completed) return <main className="mx-auto max-w-xl px-6 py-12"><h1 className="font-display text-3xl">Börja med dina frågor</h1><Button asChild className="mt-6"><Link to="/min-profil">Till mina frågor</Link></Button></main>;
  const meals = days.flatMap(date => plannedMeals(profile.data, data.meals.filter(e => e.day === date)));
  const { items } = shoppingList(meals);
  const done = new Set(checked);
  const format = (v: string) => new Date(`${v}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
  const all = [...items.map(i => i.name), ...ownItems.map(i => i.item)];
  const bought = all.filter(name => done.has(name)).length;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (guest) { setNote(GUEST_SAVE_MESSAGE); return; }
    const { item, duplicate } = prepareOwnItem(draft, all);
    if (!item) return;
    if (duplicate) { setNote(`${item} finns redan på listan.`); return; }
    const parsed = ownShoppingItemSchema.safeParse({ item, quantity });
    if (!parsed.success) return;
    setNote(''); add.mutate(parsed.data);
  }
  const row = (item: string, note?: string, removable = false) => <li key={item} className="flex items-center gap-1">
    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-3"><Checkbox aria-label={`Handlat ${item}`} checked={done.has(item)} onCheckedChange={c => toggle.mutate({ item, checked: c === true })} /><span className={`min-w-0 break-words ${done.has(item) ? 'text-muted-foreground line-through' : ''}`}>{item}</span>{note && <span className="ml-auto max-w-[40%] break-words text-right text-xs text-muted-foreground">{note}</span>}</label>
    {removable && <Button size="icon" variant="ghost" className="shrink-0" aria-label={`Ta bort ${item}`} onClick={() => remove.mutate(item)}><X className="size-4" /></Button>}
  </li>;
  return <main className="mx-auto max-w-2xl px-5 pb-12 pt-8 sm:px-10 sm:pt-12">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><h1 className="font-display text-4xl sm:text-5xl">Inköpslista</h1><p className="mt-3 text-muted-foreground">{format(first)} – {format(last)} · {bought} av {all.length} handlat</p></div>
      <div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Föregående vecka" onClick={() => setDay(shiftDay(day, -7))}><ChevronLeft /></Button><Button variant="outline" onClick={() => setDay(localDay(new Date()))}>Denna vecka</Button><Button variant="outline" size="icon" aria-label="Nästa vecka" onClick={() => setDay(shiftDay(day, 7))}><ChevronRight /></Button></div></div>
    <p className="mt-6 text-sm text-muted-foreground">Samlad från rätterna i din veckoplan. Mängden beror på hur många du handlar för – portionerna ser du i varje måltid.</p>
    <ul className="mt-4 divide-y divide-border border-y border-border">{items.map(i => row(i.name, i.count > 1 ? `${i.count} måltider` : undefined))}</ul>
    <h2 className="mt-8 font-display text-xl">Dina egna varor</h2>
    <p className="text-sm text-muted-foreground">Lägg till varorna du behöver till dina egna rätter och bocka av dem när du handlat.</p>
    <form onSubmit={submit} className="mt-4 grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_auto]">
      <div className="min-w-0"><label htmlFor="own-item" className="mb-1 block text-sm">Vara</label><Input id="own-item" value={draft} onChange={e => { setDraft(e.target.value); setNote(''); }} placeholder="T.ex. havregryn, fisk, äpplen" maxLength={120} disabled={add.isPending} /></div>
      <div className="min-w-0"><label htmlFor="own-quantity" className="mb-1 block text-sm">Mängd (valfritt)</label><Input id="own-quantity" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="T.ex. 2 st eller en påse" maxLength={80} disabled={add.isPending} /></div>
      <Button type="submit" disabled={!draft.trim() || add.isPending}><Plus />Lägg till</Button>
    </form>
    {note && <p role="alert" className="mt-2 text-sm text-muted-foreground">{note}</p>}
    {add.isError && <p role="alert" className="mt-2 text-sm text-destructive">Varan kunde inte läggas till. Försök igen.</p>}
    {toggle.isError && <p role="alert" className="mt-2 text-sm text-destructive">{toggle.error instanceof Error ? toggle.error.message : 'Det gick inte att bocka av varan.'}</p>}
    <ul className="mt-3 divide-y divide-border border-y border-border">{ownItems.map(i => row(i.item, i.quantity || undefined, true))}</ul>
    {ownItems.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Inga egna varor ännu. Skriv in det du behöver ovan.</p>}
  </main>;
}
