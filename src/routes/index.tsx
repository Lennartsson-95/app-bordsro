import { createFileRoute } from "@tanstack/react-router";
import { Link } from '@tanstack/react-router';
import { Onboarding } from '@/components/onboarding';
import { useAccount } from '@/components/auth-state';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bordsro – måltidspåminnelse utan kaloriräkning" },
      {
        name: "description",
        content:
          "Bordsro påminner dig om när du ska äta och föreslår hur mycket du behöver, efter ditt mål: gå ner, hålla eller gå upp i vikt.",
      },
      { property: "og:title", content: "Bordsro" },
      {
        property: "og:description",
        content:
          "Påminnelse om måltider och förslag på hur mycket du behöver äta – i portioner och handmått, aldrig kalorier.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAccount();
  return (
    <main>{user ? <section className="mx-auto max-w-3xl px-6 py-16"><h1 className="font-display text-4xl">Välkommen till Bordsro</h1><Button asChild className="mt-7 h-12"><Link to="/min-profil">Till mina svar</Link></Button></section> : <Onboarding />}</main>
  );
}
