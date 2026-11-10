import type { Metadata } from "next";
import Image from "next/image";
import { Bob } from "@/components/bob";
import { Eyebrow } from "@/components/content-blocks";
import { JsonLd } from "@/components/json-ld";
import { NewsletterForm } from "@/components/newsletter-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chi c'è dietro Bob",
  description:
    "Sono Tommaso, sviluppatore dal 2017 ed ex CTO di una startup dell'energia. Da due anni lavoro praticamente solo con l'AI, e con Bob ti racconto cosa ho imparato.",
  alternates: { canonical: "/chi-sono" },
};

const facts = [
  "Sviluppatore dal 2017",
  "Ex CTO di una startup dell'energia",
  "Libero professionista dal 2025",
  "SpaceXAI Ambassador",
];

export default function ChiSonoPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.owner,
    jobTitle: "Sviluppatore",
    sameAs: [site.linkedin, site.youtube, site.instagram],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 pb-16 sm:px-6">
      <Eyebrow>Chi c&apos;è dietro Bob</Eyebrow>
      <div className="mt-4 grid items-center gap-10 md:grid-cols-[1fr_auto]">
        <h1 className="font-heading text-4xl leading-tight font-bold text-balance sm:text-6xl">
          Ciao, sono Tommaso. Bob sono io, in versione cartone.
        </h1>
        <div className="flex items-end justify-center">
          <Image
            src="/tommaso.png"
            alt="Tommaso Carnemolla"
            width={200}
            height={208}
            loading="eager"
            className="h-52 w-50 rounded-3xl object-cover"
          />
          <Bob size={208} className="-ml-6" />
        </div>
      </div>

      <ul className="mt-8 flex flex-wrap gap-2">
        {facts.map((f) => (
          <li
            key={f}
            className="rounded-full bg-sand px-3 py-1 text-sm font-medium"
          >
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-12 max-w-2xl space-y-5 text-lg leading-relaxed">
        <p>
          Sono genovese, trapiantato a Firenze. Ho iniziato a scrivere software
          nel 2017 e nel 2019 sono entrato in Tate, una startup del settore luce
          e gas. Ci sono rimasto quasi sette anni, gli ultimi due da CTO.
        </p>
        <p>
          Quando Tate è stata acquisita da Plenitude, abbiamo lavorato spalla a
          spalla con il loro team prodotto. Uno dei temi principali era capire
          come integrare l&apos;AI nei loro processi di tutti i giorni.
        </p>
        <p>
          Da due anni lavoro praticamente solo con l&apos;AI. La parte difficile
          è capire bene il lavoro che vuoi togliere di mezzo: chi lo fa, con
          quali file, in quanti passaggi. Per questo con Bob parto sempre dal
          processo e scelgo lo strumento solo alla fine.
        </p>
        <p>
          Con Bob ti racconto quello che imparo, in video brevi e pratici
          pensati per chi non scrive codice.
        </p>
        <p className="text-muted-foreground">
          Quando chiudo il laptop colleziono vinili. Per anni ho fatto il DJ.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <a
          href={site.youtube}
          className={buttonVariants({
            size: "lg",
            className: "rounded-full px-4",
          })}
        >
          YouTube
        </a>
        <a
          href={site.instagram}
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "rounded-full px-4",
          })}
        >
          Instagram
        </a>
        <a
          href={site.linkedin}
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "rounded-full px-4",
          })}
        >
          LinkedIn
        </a>
      </div>

      <Card className="mt-16 rounded-2xl bg-sand p-4 text-base ring-0">
        <CardContent className="grid items-center gap-6 md:grid-cols-2">
          <h2 className="font-heading text-2xl font-bold">
            Ci sentiamo il lunedì?
          </h2>
          <NewsletterForm />
        </CardContent>
      </Card>

      <JsonLd data={jsonLd} />
    </div>
  );
}
