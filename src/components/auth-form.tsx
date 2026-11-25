import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, Mail, LoaderCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import '@lovable.dev/cloud-auth-js/styles.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { emailSchema, passwordSchema, profileSchema, type ProfileAnswers } from '@/lib/profile-schema';
import { setGuestMode } from '@/lib/guest';

export function AuthForm({ answers, defaultSignup = false }: { answers?: ProfileAnswers; defaultSignup?: boolean }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(defaultSignup ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  function changeMode(next: typeof mode) { setMode(next); setError(''); setSent(false); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    const parsedEmail = emailSchema.safeParse(email);
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedEmail.success) { setError('Skriv en giltig e-postadress.'); return; }
    if (mode === 'signup' && !parsedPassword.success) { setError('Lösenordet behöver minst 8 tecken.'); return; }
    if (mode === 'signup' && answers && !profileSchema.safeParse(answers).success) { setError('Kontrollera dina personliga svar.'); return; }
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const result = await supabase.auth.resetPasswordForEmail(parsedEmail.data, { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw result.error;
        setSent(true);
      } else if (mode === 'signup') {
        const result = await supabase.auth.signUp({ email: parsedEmail.data, password, options: { emailRedirectTo: window.location.origin, data: answers ? { onboarding: profileSchema.parse(answers) } : {} } });
        if (result.error) throw result.error;
        if (result.data.session) await navigate({ to: '/min-profil' });
        else setSent(true);
      } else {
        const result = await supabase.auth.signInWithPassword({ email: parsedEmail.data, password });
        if (result.error) throw result.error;
        await navigate({ to: '/min-profil' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message.includes('Email not confirmed') ? 'Bekräfta din e-postadress via länken i mejlet först.' : message.includes('Invalid login') ? 'E-postadressen eller lösenordet stämmer inte.' : message.includes('rate limit') ? 'För många försök. Vänta en stund och försök igen.' : 'Det gick inte att fortsätta. Kontrollera uppgifterna och försök igen.');
    } finally { setBusy(false); }
  }
  async function guest() {
    setError(''); setBusy(true);
    setGuestMode(true);
    await navigate({ to: '/idag' });
    setBusy(false);
  }
  async function social(provider: 'google' | 'lovable') {
    setError(''); setBusy(true);
    if (answers) sessionStorage.setItem('bordsro-pending-answers', JSON.stringify(answers));
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (result.error) { setError('Inloggningen avbröts. Försök igen.'); return; }
      if (!result.redirected) await navigate({ to: '/min-profil' });
    } catch { setError('Inloggningen kunde inte öppnas. Försök igen.'); }
    finally { setBusy(false); }
  }
  if (sent) return <div className="space-y-5 py-6 text-center"><Mail className="mx-auto size-9 text-primary" /><h2 className="font-display text-3xl">Titta i din inkorg</h2><p className="text-muted-foreground">{mode === 'forgot' ? 'Om adressen finns hos oss får du en länk för att välja ett nytt lösenord.' : 'Bekräfta din e-postadress med länken i mejlet. Dina svar följer med när du loggar in.'}</p><Button variant="outline" onClick={() => changeMode('login')}>Till inloggningen</Button></div>;
  return <div>
    <h2 className="font-display text-3xl">{mode === 'signup' ? 'Skapa ditt konto' : mode === 'forgot' ? 'Glömt lösenordet?' : 'Välkommen tillbaka'}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{mode === 'signup' ? 'En egen plats för dina mål och måltidsvanor.' : mode === 'forgot' ? 'Vi skickar en länk till din e-postadress.' : 'En lugn stund för dig och dina måltider.'}</p>
    {mode !== 'forgot' && <div className="mt-6 space-y-3">
      <Button disabled={busy} variant="outline" className="google-auth h-11 w-full" onClick={() => social('google')}><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-[18px]"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Fortsätt med Google</Button>
      <Button disabled={busy} variant="outline" className="lovable-auth-button h-11 w-full" onClick={() => social('lovable')}>Continue with Lovable</Button>
      <div className="flex items-center gap-3 py-2 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />eller med e-post<span className="h-px flex-1 bg-border" /></div>
    </div>}
    {mode !== 'forgot' && <div className="mt-6 border-t border-border pt-5 text-center">
      <Button disabled={busy} variant="ghost" className="h-11 w-full" onClick={guest}>Fortsätt som gäst</Button>
      <p className="mt-2 text-xs text-muted-foreground">Som gäst kan du titta runt, men inget sparas.</p>
    </div>}
    <form onSubmit={submit} className="mt-5 space-y-4">
      <label className="block space-y-2 text-sm font-medium">E-postadress<Input value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" type="email" required maxLength={255} className="h-11" placeholder="namn@exempel.se" /></label>
      {mode !== 'forgot' && <label className="block space-y-2 text-sm font-medium">Lösenord<Input value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} type="password" required minLength={mode === 'signup' ? 8 : 1} maxLength={128} className="h-11" placeholder={mode === 'signup' ? 'Minst 8 tecken' : 'Ditt lösenord'} /></label>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button disabled={busy} className="h-12 w-full" type="submit">{busy ? <LoaderCircle className="animate-spin" /> : <>{mode === 'signup' ? 'Skapa konto' : mode === 'forgot' ? 'Skicka återställningslänk' : 'Logga in'}<ArrowRight /></>}</Button>
    </form>
    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 text-sm text-muted-foreground">{mode === 'login' ? <><span>Ny hos Bordsro?</span><Button variant="link" onClick={() => changeMode('signup')}>Skapa konto</Button><Button variant="link" className="w-full" onClick={() => changeMode('forgot')}>Glömt lösenordet?</Button></> : <Button variant="link" onClick={() => changeMode('login')}>Jag har redan ett konto</Button>}</div>
  </div>;
}