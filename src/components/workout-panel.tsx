import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Dumbbell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addWorkout, deleteWorkout } from '@/lib/today.functions';
import { workoutSchema } from '@/lib/profile-schema';
import { isGuest, GUEST_SAVE_MESSAGE } from '@/lib/guest';

type Workout = { id: string; kind: string; minutes: number; intensity: string };
export function WorkoutPanel({ day, workouts }: { day: string; workouts: Workout[] }) {
  const add = useServerFn(addWorkout);
  const remove = useServerFn(deleteWorkout);
  const queryClient = useQueryClient();
  const [kind, setKind] = useState('');
  const [mins, setMins] = useState('30');
  const [intensity, setIntensity] = useState<'light' | 'hard'>('light');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run(fn: () => Promise<unknown>) {
    if (isGuest()) { setError(GUEST_SAVE_MESSAGE); return; }
    setBusy(true); setError('');
    try { await fn(); await Promise.all([queryClient.invalidateQueries({ queryKey: ['today'] }), queryClient.invalidateQueries({ queryKey: ['week'] })]); }
    catch (err) { setError(err instanceof Error ? err.message : 'Något gick fel.'); }
    finally { setBusy(false); }
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = workoutSchema.safeParse({ kind, minutes: Number(mins), intensity });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Kontrollera träningen.'); return; }
    void run(async () => { await add({ data: { ...parsed.data, day } }); setKind(''); });
  }
  return <section className="border-y border-border py-6">
    <h2 className="flex items-center gap-2 font-display text-xl"><Dumbbell className="size-5 text-primary" />Träning idag</h2>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">När du tränar föreslås lite mer mat samma dag.</p>
    {workouts.length > 0 && <ul className="mt-4 space-y-2">{workouts.map(w => <li key={w.id} className="flex items-center justify-between gap-2 rounded-md bg-secondary px-3 py-2 text-sm"><span>{w.kind} · {w.minutes} min · {w.intensity === 'hard' ? 'Ansträngande' : 'Lätt'}</span><Button variant="ghost" size="icon" aria-label={`Ta bort ${w.kind}`} title="Ta bort" disabled={busy} onClick={() => run(() => remove({ data: { id: w.id } }))}><Trash2 /></Button></li>)}</ul>}
    <form onSubmit={submit} className="mt-4 space-y-3">
      <label className="block space-y-1 text-sm font-medium">Vad gjorde du?<Input value={kind} maxLength={80} onChange={e => setKind(e.target.value)} placeholder="Till exempel promenad eller gym" className="h-11 bg-card" /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1 text-sm font-medium">Minuter<Input type="number" inputMode="numeric" min={5} max={600} value={mins} onChange={e => setMins(e.target.value)} className="h-11 bg-card" /></label>
        <fieldset><legend className="mb-1 text-sm font-medium">Hur kändes det?</legend><div className="flex flex-col gap-1 text-sm">{(['light', 'hard'] as const).map(v => <label key={v} className="flex items-center gap-2"><input type="radio" name="intensity" checked={intensity === v} onChange={() => setIntensity(v)} className="accent-primary" />{v === 'light' ? 'Lätt' : 'Ansträngande'}</label>)}</div></fieldset>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="h-11 w-full" disabled={busy}>Lägg till träning</Button>
    </form>
  </section>;
}
