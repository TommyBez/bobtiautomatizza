import type { Metadata } from "next";
import Cookie from "@/content/legal/cookie.mdx";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "Il sito Bob ti automatizza non usa cookie: ecco i dettagli.",
  alternates: { canonical: "/cookie" },
};

export default function CookiePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6">
      <h1 className="font-heading text-4xl font-bold sm:text-5xl">
        Cookie policy
      </h1>
      <p className="mt-3 text-muted-foreground">
        Ultimo aggiornamento: {site.legalUpdated}
      </p>
      <div className="mt-8">
        <Cookie />
      </div>
    </article>
  );
}
