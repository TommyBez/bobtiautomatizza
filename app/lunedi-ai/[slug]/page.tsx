import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DetailSkeleton } from "@/components/detail-skeleton";
import { NewsletterForm } from "@/components/newsletter-form";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { getPillole } from "@/lib/content";
import { formatDate, site } from "@/lib/site";

type Params = PageProps<"/lunedi-ai/[slug]">["params"];

// Tutta la route deve essere statica: gli slug non pre-generati attendono il risultato completo,
// così notFound() risponde con un 404 vero.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const pillole = await getPillole();
  return pillole.map((p) => ({ slug: p.slug }));
}

async function getPillola(slug: string) {
  const pillole = await getPillole();
  return pillole.find((p) => p.slug === slug);
}

export async function generateMetadata({
  params,
}: PageProps<"/lunedi-ai/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const pillola = await getPillola(slug);
  if (!pillola) return {};
  const description = `Le novità AI dal ${pillola.period}: ${pillola.items.map((i) => i.title).join("; ")}.`;
  return {
    title: `${pillola.title} · ${site.monday}`,
    description,
    alternates: { canonical: `${site.mondayPath}/${slug}` },
  };
}

// La pagina non legge `params`: lo fa il contenuto dentro <Suspense>.
// Gli slug noti sono prerenderizzati per intero da generateStaticParams.
export default function PillolaPage(props: PageProps<"/lunedi-ai/[slug]">) {
  return (
    <article className="mx-auto max-w-5xl px-4 pt-4 pb-16 sm:px-6">
      <Suspense fallback={<DetailSkeleton />}>
        <PillolaDetail params={props.params} />
      </Suspense>
    </article>
  );
}

async function PillolaDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const pillola = await getPillola(slug);
  if (!pillola) notFound();

  return (
    <>
      <PageBreadcrumb
        items={[
          { label: site.monday, href: site.mondayPath },
          { label: formatDate(pillola.date) },
        ]}
      />

      <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,300px)_1fr] lg:gap-16">
        <div className="mx-auto w-full max-w-[300px] md:sticky md:top-6 md:self-start">
          <YouTubeEmbed
            id={pillola.youtubeId}
            title={pillola.youtubeTitle}
            format={pillola.format}
          />
        </div>

        <div>
          <p className="font-mono text-xs tracking-widest text-primary uppercase">
            {site.monday} · {formatDate(pillola.date)}
          </p>
          <h1 className="mt-2 font-heading text-3xl leading-tight font-bold sm:text-5xl">
            {pillola.title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Le novità AI della settimana dal {pillola.period}.
          </p>

          <ol className="mt-8 space-y-4">
            {pillola.items.map((item, i) => (
              <li key={item.title}>
                <Card className="bg-paper text-base">
                  <CardHeader>
                    <CardTitle className="font-heading text-xl font-bold">
                      <span className="text-primary">{i + 1}.</span>{" "}
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  {item.text || item.source ? (
                    <CardContent className="space-y-2">
                      {item.text ? <p>{item.text}</p> : null}
                      {item.source ? (
                        <a
                          href={item.source}
                          className="text-sm font-medium text-primary underline underline-offset-4"
                        >
                          Fonte
                        </a>
                      ) : null}
                    </CardContent>
                  ) : null}
                </Card>
              </li>
            ))}
          </ol>

          <section className="mt-12">
            <h2 className="font-heading text-2xl font-bold">
              La prossima pillola, nella tua email
            </h2>
            <NewsletterForm className="mt-4 max-w-md" />
          </section>
        </div>
      </div>
    </>
  );
}
