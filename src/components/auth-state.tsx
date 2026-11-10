import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });
export const useAccount = () => useContext(AuthContext);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const { data } = await supabase.auth.getUser();
      if (active) { setUser(data.user); setReady(true); }
    };
    const { data: listener } = supabase.auth.onAuthStateChange(event => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
      if (event === 'SIGNED_OUT') { setUser(null); setReady(true); }
      else void refresh();
      void router.invalidate();
      if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries();
    });
    void refresh();
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [router, queryClient]);
  return <AuthContext.Provider value={{ user, ready }}>{children}</AuthContext.Provider>;
}