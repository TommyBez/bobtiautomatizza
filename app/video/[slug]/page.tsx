import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VideoList } from "@/components/content-blocks";
import { DetailSkeleton } from "@/components/detail-skeleton";
import { JsonLd } from "@/components/json-ld";
import { NewsletterForm } from "@/components/newsletter-form";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { getVideos } from "@/lib/content";
import { formatDate, openGraphDefaults } from "@/lib/site";

type Params = PageProps<"/video/[slug]">["params"];

// Tutta la route deve essere statica: gli slug non pre-generati attendono il risultato completo,
// così notFound() risponde con un 404 vero.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const videos = await getVideos();
  return videos.map((v) => ({ slug: v.slug }));
}

async function getVideo(slug: string) {
  const videos = await getVideos();
  return videos.find((v) => v.slug === slug);
}

export async function generateMetadata({
  params,
}: PageProps<"/video/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideo(slug);
  if (!video) return {};
  return {
    title: video.title,
    description: video.description,
    alternates: { canonical: `/video/${slug}` },
    // L'immagine arriva da ./opengraph-image.tsx. `openGraph` qui sostituisce quello del layout,
    // per questo si ripetono siteName e locale.
    openGraph: {
      ...openGraphDefaults,
      type: "video.other",
      title: video.title,
      description: video.description,
    },
  };
}

// La pagina non legge `params`: lo fa il contenuto dentro <Suspense>.
// Gli slug noti sono prerenderizzati per intero da generateStaticParams.
export default function VideoDetailPage(props: PageProps<"/video/[slug]">) {
  return (
    <article className="mx-auto max-w-6xl px-4 pt-4 pb-16 sm:px-6">
      <Suspense fallback={<DetailSkeleton />}>
        <VideoDetail params={props.params} />
      </Suspense>
    </article>
  );
}

async function VideoDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const video = await getVideo(slug);
  if (!video) notFound();

  const { default: Body } = await import(`@/content/video/${slug}.mdx`);
  const others = (await getVideos()).filter((v) => v.slug !== slug).slice(0, 3);

  return (
    <>
      <PageBreadcrumb
        items={[{ label: "Video", href: "/video" }, { label: video.title }]}
      />

      <header className="mt-6 max-w-3xl">
        <h1 className="font-heading text-3xl leading-tight font-bold text-balance sm:text-5xl">
          {video.title}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Dal video «{video.youtubeTitle}»
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <time dateTime={video.date}>{formatDate(video.date)}</time>
          <span aria-hidden="true">·</span>
          <Badge variant="outline">Senza codice</Badge>
          {video.tools.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
      </header>

      <div
        className={
          video.format === "short"
            ? "mt-10 grid gap-10 md:grid-cols-[minmax(0,320px)_1fr] lg:gap-16"
            : "mt-10 grid gap-10"
        }
      >
        <div
          className={
            video.format === "short"
              ? "mx-auto w-full max-w-[320px] md:sticky md:top-6 md:self-start"
              : ""
          }
        >
          <YouTubeEmbed
            id={video.youtubeId}
            title={video.youtubeTitle}
            format={video.format}
          />
        </div>

        <div className="max-w-2xl">
          <Card className="bg-paper text-base">
            <CardHeader>
              <CardTitle className="font-mono text-xs tracking-widest text-primary uppercase">
                In breve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {video.inBreve.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="mt-10">
            <Body />
          </div>

          <Card className="mt-12 rounded-2xl bg-sand p-2 text-base ring-0">
            <CardHeader>
              <CardTitle className="font-heading text-2xl font-bold">
                Ogni lunedì nella tua email
              </CardTitle>
              <p className="text-muted-foreground">
                Le novità AI della settimana, più i video usciti nei giorni
                prima.
              </p>
            </CardHeader>
            <CardContent>
              <NewsletterForm className="max-w-md" />
            </CardContent>
          </Card>
        </div>
      </div>

      {others.length > 0 ? (
        <section className="mt-20 border-t pt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-heading text-2xl font-bold">Altri video</h2>
            <Link
              href="/video"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Tutti i video <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <VideoList videos={others} />
        </section>
      ) : null}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: video.title,
          description: video.description,
          thumbnailUrl: [
            `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`,
          ],
          uploadDate: video.date,
          embedUrl: `https://www.youtube-nocookie.com/embed/${video.youtubeId}`,
          contentUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
          inLanguage: "it",
        }}
      />
    </>
  );
}
