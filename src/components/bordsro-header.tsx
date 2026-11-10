import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, LogOut, Menu, ShoppingBasket, UserRound, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAccount } from './auth-state';
import { supabase } from '@/integrations/supabase/client';
import icon from '@/assets/bordsro-ikon.png';

const menuItem = 'flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium transition-colors hover:bg-secondary';

export function BordsroHeader() {
  const { user, ready } = useAccount();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  async function signOut() {
    setOpen(false);
    await queryClient.cancelQueries(); queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) return;
    await navigate({ to: '/auth', replace: true });
  }
  return <header className="border-b border-border"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-10">
    <Link to="/" className="flex items-center gap-2"><img src={icon} alt="" className="size-11 object-contain" /><span className="font-display text-2xl text-primary">Bordsro</span></Link>
    {ready && (user ? <>
      <nav aria-label="Huvudmeny" className="hidden items-center gap-1 md:flex"><Button variant="ghost" className="px-2 sm:px-4" asChild><Link to="/idag" title="Idag" aria-label="Idag" activeProps={{ className: 'bg-secondary' }}><Utensils /><span className="hidden sm:inline">Idag</span></Link></Button><Button variant="ghost" className="px-2 sm:px-4" asChild><Link to="/vecka" title="Vecka" aria-label="Vecka" activeProps={{ className: 'bg-secondary' }}><CalendarDays /><span className="hidden sm:inline">Vecka</span></Link></Button><Button variant="ghost" className="px-2 sm:px-4" asChild><Link to="/inkop" title="Inköpslista" aria-label="Inköpslista" activeProps={{ className: 'bg-secondary' }}><ShoppingBasket /><span className="hidden sm:inline">Inköp</span></Link></Button><Button variant="ghost" className="px-2 sm:px-4" asChild><Link to="/min-profil" title="Min profil" aria-label="Min profil" activeProps={{ className: 'bg-secondary' }}><UserRound /><span className="hidden sm:inline">Min profil</span></Link></Button><Button size="icon" title="Logga ut" aria-label="Logga ut" onClick={signOut}><LogOut /></Button></nav>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><Button variant="ghost" size="icon" className="md:hidden" title="Öppna menyn" aria-label="Öppna menyn" aria-haspopup="dialog"><Menu /></Button></SheetTrigger>
        <SheetContent side="right" className="flex w-[82%] max-w-[19rem] flex-col gap-0 px-5 py-6">
          <SheetHeader className="text-left"><SheetTitle className="flex items-center gap-2 font-display text-2xl text-primary"><img src={icon} alt="" className="size-8 object-contain" />Bordsro</SheetTitle></SheetHeader>
          <nav aria-label="Mobilmeny" className="mt-6 flex flex-col gap-1">
            <Link to="/idag" className={cn(menuItem, pathname === '/idag' && 'bg-secondary text-primary')}><Utensils className="size-5" />Idag</Link>
            <Link to="/vecka" className={cn(menuItem, pathname === '/vecka' && 'bg-secondary text-primary')}><CalendarDays className="size-5" />Vecka</Link>
            <Link to="/inkop" className={cn(menuItem, pathname === '/inkop' && 'bg-secondary text-primary')}><ShoppingBasket className="size-5" />Inköp</Link>
            <Link to="/min-profil" className={cn(menuItem, pathname === '/min-profil' && 'bg-secondary text-primary')}><UserRound className="size-5" />Min profil</Link>
          </nav>
          <Button className="mt-auto w-full" onClick={signOut}><LogOut />Logga ut</Button>
        </SheetContent>
      </Sheet>
    </> : <Button variant="ghost" asChild><Link to="/auth"><UserRound />Logga in</Link></Button>)}
  </div></header>;
}
