import { createFileRoute } from '@tanstack/react-router';
import { AuthForm } from '@/components/auth-form';
import { pageHead } from '@/lib/page-head';
import { useAccount } from '@/components/auth-state';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/auth')({ head: () => pageHead('Logga in – Bordsro', 'Logga in eller skapa ditt personliga Bordsro-konto.'), component: AuthPage });
function AuthPage() {
  const { user } = useAccount();
  return <main className="mx-auto max-w-md px-6 py-12">{user ? <div className="space-y-6"><h1 className="font-display text-3xl">Du är inloggad</h1><Button asChild><Link to="/min-profil">Till min profil</Link></Button></div> : <AuthForm />}</main>;
}