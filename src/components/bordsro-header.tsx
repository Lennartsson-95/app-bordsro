import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, LogOut, ShoppingBasket, UserRound, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAccount } from './auth-state';

export function MobileNavSpacer() {
  const { user, ready } = useAccount();
  if (!ready || !user) return null;
  return <div aria-hidden="true" className="h-20 md:hidden" />;
}
import { supabase } from '@/integrations/supabase/client';
import icon from '@/assets/bordsro-ikon.png';

const tabs = [
  { to: '/idag', label: 'Idag', icon: Utensils },
  { to: '/vecka', label: 'Vecka', icon: CalendarDays },
  { to: '/inkop', label: 'Inköp', icon: ShoppingBasket },
  { to: '/min-profil', label: 'Min profil', icon: UserRound },
] as const;

export function BordsroHeader() {
  const { user, ready } = useAccount();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  async function signOut() {
    await queryClient.cancelQueries(); queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) return;
    await navigate({ to: '/auth', replace: true });
  }
  return <>
    <header className="border-b border-border"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-10">
      <Link to="/" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"><img src={icon} alt="" className="size-11 object-contain" /><span className="font-display text-2xl text-primary">Bordsro</span></Link>
      {ready && (user ? <nav aria-label="Huvudmeny" className="hidden items-center gap-1 md:flex"><Button variant="ghost" className="px-2 sm:px-4" asChild><Link to="/idag" title="Idag" aria-label="Idag" activeProps={{ className: 'bg-secondary' }}><Utensils /><span className="hidden sm:inline">Idag</span></Link></Button><Button variant="ghost" className="px-2 sm:px-4" asChild><Link to="/vecka" title="Vecka" aria-label="Vecka" activeProps={{ className: 'bg-secondary' }}><CalendarDays /><span className="hidden sm:inline">Vecka</span></Link></Button><Button variant="ghost" className="px-2 sm:px-4" asChild><Link to="/inkop" title="Inköpslista" aria-label="Inköpslista" activeProps={{ className: 'bg-secondary' }}><ShoppingBasket /><span className="hidden sm:inline">Inköp</span></Link></Button><Button variant="ghost" className="px-2 sm:px-4" asChild><Link to="/min-profil" title="Min profil" aria-label="Min profil" activeProps={{ className: 'bg-secondary' }}><UserRound /><span className="hidden sm:inline">Min profil</span></Link></Button><Button size="icon" title="Logga ut" aria-label="Logga ut" onClick={signOut}><LogOut /></Button></nav> : <Button variant="ghost" asChild><Link to="/auth"><UserRound />Logga in</Link></Button>)}
    </div></header>
    {ready && user && <>
      <nav aria-label="Mobilmeny" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex items-stretch justify-around px-2">
          {tabs.map(({ to, label, icon: TabIcon }) => {
            const active = pathname === to;
            return <Link key={to} to={to} aria-current={active ? 'page' : undefined} className={cn('flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md px-1 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', active ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
              <TabIcon className="size-5" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </Link>;
          })}
          <button type="button" onClick={signOut} aria-label="Logga ut" className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md px-1 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <LogOut className="size-5" aria-hidden="true" />
            <span className="truncate">Logga ut</span>
          </button>
        </div>
      </nav>
    </>}
  </>;
}
