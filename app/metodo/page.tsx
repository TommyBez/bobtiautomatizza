import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/content-blocks";
import { NewsletterForm } from "@/components/newsletter-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVideos } from "@/lib/content";
import { metodo } from "@/lib/site";

export const metadata: Metadata = {
  title: "Il metodo",
  description:
    "Prima capisci il processo, poi lo ripulisci, solo alla fine ci metti l'AI. Il modo in cui Bob affronta ogni lavoro ripetitivo.",
  alternates: { canonical: "/metodo" },
};

const details: Record<string, string[]> = {
  "01": [
    "Prendi un lavoro che fai ogni settimana e scrivi i passaggi come li fai oggi, uno sotto l'altro. Anche quelli che sembrano troppo ovvi per essere scritti.",
    "Segna da dove arrivano le informazioni, dove finiscono e chi le guarda. Spesso il problema vero salta fuori già qui.",
  ],
  "02": [
    "Rileggi la lista e chiediti, passaggio per passaggio, se serve ancora. Togli i controlli doppi, i file copiati due volte, i messaggi che nessuno legge.",
    "Ogni passaggio che togli adesso è un passaggio in meno da automatizzare e da tenere sotto controllo.",
  ],
  "03": [
    "Solo adesso scegli lo strumento, e solo per i passaggi che restano. A volte basta una formula in un foglio di calcolo. A volte serve un assistente, come i Progetti di Claude. A volte un bot che lavora da solo, come Grok Bot.",
    "Per tutto quello che è delicato, l'ultima parola resta a te. Nel report di Meta Ads, per esempio, il connettore potrebbe anche modificare le campagne: io gli lascio solo la lettura.",
  ],
};

export default async function MetodoPage() {
  const videos = await getVideos();

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 pb-16 sm:px-6">
      <Eyebrow>Il metodo</Eyebrow>
      <h1 className="mt-2 font-heading text-4xl leading-tight font-bold text-balance sm:text-6xl">
        Prima capisci il processo. Poi ci metti l&apos;AI.
      </h1>
      <p className="mt-5 max-w-2xl text-xl text-muted-foreground">
        È il modo in cui affronto ogni lavoro ripetitivo, prima di aprire
        qualsiasi strumento. Tre passi, sempre in quest&apos;ordine.
      </p>

      <ol className="mt-12 space-y-6">
        {metodo.map((m) => (
          <li key={m.n}>
            <Card className="rounded-2xl bg-paper p-2 text-base">
              <CardHeader className="flex items-baseline gap-4">
                <span className="font-heading text-5xl font-bold text-primary">
                  {m.n}
                </span>
                <CardTitle className="font-heading text-2xl font-bold">
                  {m.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-lg leading-relaxed">
                {details[m.n].map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <section className="mt-16">
        <h2 className="font-heading text-2xl font-bold">Il metodo applicato</h2>
        <ul className="mt-4 space-y-2 text-lg">
          {videos.map((v) => (
            <li key={v.slug}>
              <Link
                href={`/video/${v.slug}`}
                className="font-medium text-primary underline underline-offset-4"
              >
                {v.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 rounded-2xl bg-sand p-6 sm:p-10">
        <h2 className="font-heading text-2xl font-bold">
          Ogni lunedì, la pillola nella tua email
        </h2>
        <p className="mt-2 text-muted-foreground">
          Le novità AI della settimana, più i video usciti nei giorni prima.
        </p>
        <NewsletterForm className="mt-6 max-w-md" />
      </section>
    </div>
  );
}
