import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, UserRound, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount } from './auth-state';
import { supabase } from '@/integrations/supabase/client';
import icon from '@/assets/bordsro-ikon.png';

export function BordsroHeader() {
  const { user, ready } = useAccount();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await queryClient.cancelQueries(); queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) return;
    await navigate({ to: '/auth', replace: true });
  }
  return <header className="border-b border-border"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-10">
    <Link to="/" className="flex items-center gap-2"><img src={icon} alt="" className="size-11 object-contain" /><span className="font-display text-2xl text-primary">Bordsro</span></Link>
    {ready && (user ? <nav aria-label="Huvudmeny" className="flex items-center gap-1"><Button variant="ghost" asChild><Link to="/idag" activeProps={{ className: 'bg-secondary' }}><Utensils /><span>Idag</span></Link></Button><Button variant="ghost" asChild><Link to="/min-profil" title="Min profil" aria-label="Min profil" activeProps={{ className: 'bg-secondary' }}><UserRound /><span className="hidden sm:inline">Min profil</span></Link></Button><Button variant="ghost" size="icon" title="Logga ut" aria-label="Logga ut" onClick={signOut}><LogOut /></Button></nav> : <Button variant="ghost" asChild><Link to="/auth"><UserRound />Logga in</Link></Button>)}
  </div></header>;
}