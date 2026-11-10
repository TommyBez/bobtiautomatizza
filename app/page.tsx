import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Bob } from "@/components/bob";
import {
  EmailPreview,
  Eyebrow,
  MetodoSteps,
  PillolaNote,
  VideoList,
} from "@/components/content-blocks";
import { NewsletterForm } from "@/components/newsletter-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getPillole, getVideos } from "@/lib/content";
import { site } from "@/lib/site";

// Etichette barrate attorno a Bob: lavori ripetitivi presi dai video.
const tasks = [
  {
    label: "report mensile",
    className: "bg-olive-light -rotate-6 left-0 top-10",
  },
  {
    label: "rispiegare tutto a Claude",
    className: "bg-jeans-light rotate-3 right-0 top-2",
  },
  {
    label: "bozze delle email",
    className: "bg-[#f3d9a4] rotate-6 right-0 bottom-24",
  },
  { label: "copia-incolla", className: "bg-accent -rotate-3 left-2 bottom-12" },
];

export default async function Home() {
  const [videos, pillole] = await Promise.all([getVideos(), getPillole()]);
  const pillola = pillole[0];
  const caso = videos.find((v) => v.slug === "report-meta-ads-claude");

  return (
    <>
      {/* Apertura */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-6 pb-16 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:pt-12">
        <div>
          <h1 className="font-heading text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl">
            {site.headline}
          </h1>
          <p className="mt-5 text-xl text-muted-foreground">{site.sub}</p>
          <NewsletterForm className="mt-8 max-w-md" />
          <p className="mt-6 text-sm text-muted-foreground">
            Mi trovi anche su{" "}
            <a
              href={site.youtube}
              className="font-semibold text-foreground underline underline-offset-4"
            >
              YouTube
            </a>{" "}
            e{" "}
            <a
              href={site.instagram}
              className="font-semibold text-foreground underline underline-offset-4"
            >
              Instagram
            </a>
            .
          </p>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <Bob size={448} eager alt="Bob" className="mx-auto h-full w-auto" />
          {tasks.map((t) => (
            <span
              key={t.label}
              aria-hidden="true"
              className={`absolute rounded-md px-3 py-1 text-sm font-medium line-through decoration-foreground/60 shadow-sm ${t.className}`}
            >
              {t.label}
            </span>
          ))}
        </div>
      </section>

      {/* Ultimi video + pillola */}
      <section className="border-t">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="flex items-baseline justify-between">
              <h2 className="font-heading text-3xl font-bold">Ultimi video</h2>
              <Link
                href="/video"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
              >
                Tutti i video <ArrowRightIcon className="size-4" />
              </Link>
            </div>
            <div className="mt-4">
              <VideoList videos={videos.slice(0, 5)} />
            </div>
          </div>
          {pillola ? <PillolaNote pillola={pillola} /> : null}
        </div>
      </section>

      {/* Metodo */}
      <section className="bg-sand">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Eyebrow>Il metodo</Eyebrow>
          <h2 className="mt-2 max-w-2xl font-heading text-4xl leading-tight font-bold">
            Prima capisci il processo. Poi ci metti l&apos;AI.
          </h2>
          <div className="mt-10">
            <MetodoSteps />
          </div>
          <Link
            href="/metodo"
            className="mt-8 inline-flex items-center gap-1 font-semibold text-primary"
          >
            Come funziona il metodo <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </section>

      {/* Caso reale + chi c'è dietro Bob */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2">
        {caso ? (
          <Link href={`/video/${caso.slug}`} className="group">
            <Card className="h-full rounded-2xl bg-jeans-light p-4 text-base ring-0">
              <CardHeader>
                <Eyebrow>Caso reale</Eyebrow>
                <p className="font-heading text-3xl leading-tight font-bold text-foreground">
                  Un&apos;agenzia di marketing e il report mensile di Meta Ads
                </p>
              </CardHeader>
              <CardContent>
                <p>
                  Ogni mese il report delle campagne si preparava a mano. Ora è
                  una dashboard in Claude che si aggiorna con un clic.
                </p>
                <span className="mt-6 inline-flex items-center gap-1 font-semibold group-hover:underline">
                  Guarda come <ArrowRightIcon className="size-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ) : null}
        <Card className="rounded-2xl p-4 text-base">
          <CardHeader className="flex items-center">
            <Image
              src="/tommaso.png"
              alt="Tommaso Carnemolla"
              width={72}
              height={72}
              className="size-18 rounded-full object-cover"
            />
            <Bob size={72} className="ml-1" />
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">
              Dietro Bob ci sono io, Tommaso. Genovese trapiantato a Firenze,
              sviluppatore dal 2017. Sono stato CTO di una startup
              dell&apos;energia e ho lavorato con il team prodotto di Plenitude
              per capire come integrare l&apos;AI nei suoi processi. Bob è il
              modo in cui ti racconto quello che ho imparato.
            </p>
            <Link
              href="/chi-sono"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Chi c&apos;è dietro Bob <ArrowRightIcon className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Newsletter con anteprima */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="font-heading text-4xl leading-tight font-bold">
              Ogni lunedì, una pillola nella tua email.
            </h2>
            <p className="mt-3 text-lg text-primary-foreground/80">
              Le novità AI della settimana spiegate in due righe, e i video
              nuovi. Anche se non guardi YouTube.
            </p>
            <NewsletterForm tone="dark" className="mt-8 max-w-md" />
          </div>
          {pillola ? (
            <EmailPreview pillola={pillola} videos={videos.slice(0, 2)} />
          ) : null}
        </div>
      </section>
    </>
  );
}
