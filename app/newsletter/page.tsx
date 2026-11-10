import type { Metadata } from "next";
import { EmailPreview } from "@/components/content-blocks";
import { NewsletterForm } from "@/components/newsletter-form";
import { getPillole, getVideos } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "Ogni lunedì le novità AI della settimana e i video usciti nei giorni prima, nella tua email.",
  alternates: { canonical: "/newsletter" },
};

export default async function NewsletterPage() {
  const [pillole, videos] = await Promise.all([getPillole(), getVideos()]);
  const pillola = pillole[0];

  return (
    <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 pt-6 pb-16 sm:px-6 md:grid-cols-2">
      <div>
        <h1 className="font-heading text-4xl leading-tight font-bold sm:text-5xl">
          Ogni lunedì, una pillola nella tua email.
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Le novità AI della settimana e i video usciti nei giorni prima. Un
          messaggio solo, il lunedì.
        </p>
        <NewsletterForm className="mt-8 max-w-md" />
      </div>
      {pillola ? (
        <div>
          <p className="mb-4 font-mono text-xs tracking-widest text-primary uppercase">
            Cosa ti arriva
          </p>
          <EmailPreview pillola={pillola} videos={videos.slice(0, 2)} />
        </div>
      ) : null}
    </div>
  );
}
