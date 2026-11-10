import { createFileRoute } from "@tanstack/react-router";

import logo from "@/assets/bordsro-logga-tallrik-v2.png";

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
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#f5f0e8" }}
    >
      <img
        src={logo}
        alt="Bordsro"
        width={1024}
        height={1024}
        className="h-auto w-[min(78vw,340px)]"
      />
      <p
        className="mt-8 max-w-sm text-center text-base leading-relaxed"
        style={{ color: "#5f7a59" }}
      >
        Påminnelse om nästa måltid och hur mycket du behöver äta – i portioner och
        handmått, aldrig kalorier.
      </p>
    </div>
  );
}
