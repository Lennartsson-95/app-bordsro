import { useEffect, useState, Suspense } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery, queryOptions, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Check, Pencil, Leaf } from 'lucide-react';
import { getProfile, saveProfile } from '@/lib/profile.functions';
import { pageHead } from '@/lib/page-head';
import { goalChoices, profileSchema, initialAnswers, type ProfileAnswers } from '@/lib/profile-schema';
import { Onboarding } from '@/components/onboarding';
import { Button } from '@/components/ui/button';

const profileQuery = queryOptions({ queryKey: ['my-profile'], queryFn: () => getProfile() });
export const Route = createFileRoute('/_authenticated/min-profil')({
  head: () => pageHead('Min profil – Bordsro', 'Ditt mål och dina personliga måltidsvanor i Bordsro.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery),
  component: ProfilePage,
});
function ProfilePage() { return <Suspense fallback={<p className="p-10 text-center">Hämtar dina svar…</p>}><ProfileContent /></Suspense>; }
function ProfileContent() {
  const { data } = useSuspenseQuery(profileQuery);
  const save = useServerFn(saveProfile);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<ProfileAnswers | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const raw = sessionStorage.getItem('bordsro-pending-answers');
    if (!raw) return;
    try { const parsed = profileSchema.safeParse(JSON.parse(raw)); if (parsed.success && !data.completed) setPending(parsed.data); }
    catch { /* Invalid draft is ignored. */ }
    sessionStorage.removeItem('bordsro-pending-answers');
  }, [data.completed]);
  async function persist(answers: ProfileAnswers) {
    await save({ data: answers });
    await queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    setPending(null); setEditing(false); setSaved(true);
  }
  const parsed = profileSchema.safeParse(data);
  if (!data.completed || editing || pending) return <main><Onboarding existing={pending ?? (parsed.success ? parsed.data : { ...initialAnswers, display_name: data.display_name })} onSave={persist} /></main>;
  const goal = goalChoices.find(g => g.value === data.goal);
  const dietLabel = { mixed: 'Jag äter det mesta', vegetarian: 'Vegetariskt', vegan: 'Veganskt', pescatarian: 'Vegetariskt & fisk' }[data.diet as ProfileAnswers['diet']];
  return <main className="mx-auto max-w-3xl px-6 py-12"><p className="mb-3 flex items-center gap-2 text-sm text-primary"><Leaf className="size-4" />Din egen måltidsrytm</p><h1 className="font-display text-4xl">Välkommen, {data.display_name}</h1><p className="mt-4 text-muted-foreground">{saved ? 'Dina ändringar är sparade.' : 'Ditt mål och dina svar är sparade.'}</p><section className="mt-10 border-y border-border py-7"><div className="flex items-center justify-between gap-4"><h2 className="font-display text-2xl">{goal?.title}</h2><Check className="text-primary" /></div><dl className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Matvanor</dt><dd className="mt-1">{dietLabel}</dd></div><div><dt className="text-sm text-muted-foreground">Allergier och sådant du undviker</dt><dd className="mt-1 break-words">{data.allergies || 'Inget angivet'}</dd></div><div><dt className="text-sm text-muted-foreground">Rörelse</dt><dd className="mt-1">{data.activity === 'low' ? 'Lite rörelse' : data.activity === 'high' ? 'Mycket rörelse' : 'En del rörelse'}</dd></div><div><dt className="text-sm text-muted-foreground">Din dag</dt><dd className="mt-1">Vaknar {data.wake_time} · Lägger dig {data.sleep_time}</dd></div></dl></section><Button variant="outline" className="mt-7 h-11" onClick={() => setEditing(true)}><Pencil />Ändra mina svar</Button></main>;
}