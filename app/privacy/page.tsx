import type { Metadata } from "next";
import Privacy from "@/content/legal/privacy.mdx";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Informativa privacy",
  description:
    "Quali dati raccoglie il sito Bob ti automatizza, perché, e quali diritti hai.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  // Un'informativa senza contatto del titolare non è valida: in produzione la build si ferma.
  if (!site.privacyEmail && process.env.VERCEL_ENV === "production") {
    throw new Error(
      "Manca site.privacyEmail: l'informativa privacy non può andare online senza contatto.",
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6">
      <h1 className="font-heading text-4xl font-bold sm:text-5xl">
        Informativa privacy
      </h1>
      <p className="mt-3 text-muted-foreground">
        Ultimo aggiornamento: {site.legalUpdated}
      </p>
      <div className="mt-8">
        <Privacy />
      </div>
    </article>
  );
}
