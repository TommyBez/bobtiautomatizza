import type { Metadata } from "next";
import Link from "next/link";
import { Bob } from "@/components/bob";
import { NewsletterForm } from "@/components/newsletter-form";
import { Badge } from "@/components/ui/badge";
import { getVideos } from "@/lib/content";
import { formatShortDate } from "@/lib/site";

export const metadata: Metadata = {
  title: "Video",
  description:
    "Tutti i video di Bob: come usare l'AI per togliersi di dosso il lavoro ripetitivo, anche senza scrivere codice.",
  alternates: { canonical: "/video" },
};

// Copertine a colori (dal prototipo B): il titolo è la copertina.
const tileColors = [
  "bg-primary",
  "bg-[#3d6b8f]",
  "bg-[#a0773f]",
  "bg-[#2f3a14]",
  "bg-[#6f7d38]",
  "bg-[#5b7f9e]",
];

export default async function VideoPage() {
  const videos = await getVideos();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6">
      <h1 className="font-heading text-4xl font-bold sm:text-5xl">Video</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Video brevi e pratici per togliersi di dosso il lavoro ripetitivo con
        l&apos;AI, anche se non scrivi codice.
      </p>

      <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v, i) => (
          <li key={v.slug}>
            <Link href={`/video/${v.slug}`} className="group block">
              <div
                className={`relative aspect-video overflow-hidden rounded-xl p-5 text-white ${tileColors[i % tileColors.length]}`}
              >
                <p className="max-w-[78%] font-heading text-xl leading-tight font-bold">
                  {v.youtubeTitle}
                </p>
                <Bob
                  size={160}
                  className="absolute right-4 bottom-0 h-[80%] w-auto translate-y-[6%]"
                />
              </div>
              <h2 className="mt-3 text-lg leading-snug font-semibold group-hover:text-primary">
                {v.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <span>{formatShortDate(v.date)}</span>
                {v.tools.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-20 grid items-center gap-6 rounded-2xl bg-jeans-light p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="font-heading text-3xl font-bold">
            Ogni lunedì, i video della settimana nella tua email.
          </h2>
          <p className="mt-2 text-muted-foreground">
            Insieme alla pillola con le novità AI.
          </p>
        </div>
        <NewsletterForm />
      </section>
    </div>
  );
}
