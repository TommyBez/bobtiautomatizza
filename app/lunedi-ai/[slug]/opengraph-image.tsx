import { notFound } from "next/navigation";
import { getPillole } from "@/lib/content";
import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { formatDate, site } from "@/lib/site";

export const alt = `Le novità AI della settimana, da ${site.monday}`;
export const size = ogSize;
export const contentType = ogContentType;

// Le immagini delle pillole note si generano in fase di build, come le pagine.
export async function generateStaticParams() {
  const pillole = await getPillole();
  return pillole.map((p) => ({ slug: p.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pillola = (await getPillole()).find((p) => p.slug === slug);
  if (!pillola) notFound();

  return ogImage({
    eyebrow: `${site.monday} · ${formatDate(pillola.date)}`,
    title: pillola.title,
    items: pillola.items.map((i) => i.title),
  });
}
