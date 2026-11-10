import { useEffect, useState, type FormEvent } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { pageHead } from '@/lib/page-head';
import { passwordSchema } from '@/lib/profile-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export const Route = createFileRoute('/reset-password')({ head: () => pageHead('Nytt lösenord – Bordsro', 'Välj ett nytt lösenord för ditt Bordsro-konto.'), component: ResetPassword });
function ResetPassword() {
  const [valid, setValid] = useState(false); const [ready, setReady] = useState(false);
  const [password, setPassword] = useState(''); const [repeat, setRepeat] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const recovery = hash.get('type') === 'recovery';
    async function check() {
      if (recovery) sessionStorage.setItem('bordsro-recovery', 'true');
      const { data } = await supabase.auth.getUser();
      setValid(Boolean(data.user) && (recovery || sessionStorage.getItem('bordsro-recovery') === 'true')); setReady(true);
    }
    void check();
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    if (!passwordSchema.safeParse(password).success) { setError('Lösenordet behöver minst 8 tecken.'); return; }
    if (repeat !== password) { setError('Lösenorden stämmer inte överens.'); return; }
    setBusy(true);
    const { error: failure } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (failure) { setError('Lösenordet kunde inte ändras. Begär en ny länk och försök igen.'); return; }
    sessionStorage.removeItem('bordsro-recovery'); setDone(true);
  }
  return <main className="mx-auto max-w-md px-6 py-12"><h1 className="font-display text-4xl">{done ? 'Lösenordet är ändrat' : 'Välj ett nytt lösenord'}</h1>{!ready ? <p className="mt-6">Kontrollerar länken…</p> : done ? <Button asChild className="mt-6"><Link to="/min-profil">Till min profil</Link></Button> : !valid ? <div className="mt-6 space-y-5"><p>Länken är ogiltig eller har gått ut.</p><Button asChild><Link to="/auth">Begär en ny länk</Link></Button></div> : <form className="mt-8 space-y-5" onSubmit={submit}><label className="block space-y-2">Nytt lösenord<Input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label><label className="block space-y-2">Upprepa lösenordet<Input type="password" required maxLength={128} autoComplete="new-password" value={repeat} onChange={e => setRepeat(e.target.value)} /></label>{error && <p role="alert" className="text-destructive">{error}</p>}<Button disabled={busy} type="submit">{busy ? 'Sparar…' : 'Spara nytt lösenord'}</Button></form>}</main>;
}