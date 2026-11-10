import { notFound } from "next/navigation";
import { getVideos } from "@/lib/content";
import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { formatDate, site } from "@/lib/site";

export const alt = `Copertina di un video di ${site.name}`;
export const size = ogSize;
export const contentType = ogContentType;

// Le immagini dei video noti si generano in fase di build, come le pagine.
export async function generateStaticParams() {
  const videos = await getVideos();
  return videos.map((v) => ({ slug: v.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const video = (await getVideos()).find((v) => v.slug === slug);
  if (!video) notFound();

  return ogImage({
    eyebrow: `Video · ${formatDate(video.date)}`,
    title: video.title,
    tags: ["Senza codice", ...video.tools].slice(0, 4),
  });
}
