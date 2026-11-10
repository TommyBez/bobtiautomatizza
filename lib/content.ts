import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";

/** Un video divulgativo. I metadati stanno in `export const metadata` dentro `content/video/<slug>.mdx`. */
export type VideoMeta = {
  /** Titolo della pagina, scritto come una ricerca su Google. */
  title: string;
  /** Titolo del video su YouTube, mostrato come sottotitolo. */
  youtubeTitle: string;
  youtubeId: string;
  /** "short" = verticale 9:16, "long" = orizzontale 16:9. */
  format: "short" | "long";
  date: string;
  description: string;
  inBreve: string[];
  /** Etichette libere: diventano pagine argomento solo da 3 video in su. */
  topics: string[];
  tools: string[];
};

export type Video = VideoMeta & { slug: string };

export type PillolaMeta = {
  title: string;
  youtubeTitle: string;
  youtubeId: string;
  format: "short" | "long";
  date: string;
  /** Settimana coperta, es. "30 ottobre – 6 novembre 2026". */
  period: string;
  items: { title: string; text?: string; source?: string }[];
};

export type Pillola = PillolaMeta & { slug: string };

const contentDir = path.join(process.cwd(), "content");

async function slugsIn(folder: string) {
  const files = await readdir(path.join(contentDir, folder));
  return files
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

const byDateDesc = (a: { date: string }, b: { date: string }) =>
  b.date.localeCompare(a.date);

export async function getVideos(): Promise<Video[]> {
  "use cache";
  cacheLife("max");
  const slugs = await slugsIn("video");
  const videos = await Promise.all(
    slugs.map(async (slug) => {
      const { metadata } = (await import(`@/content/video/${slug}.mdx`)) as {
        metadata: VideoMeta;
      };
      return { ...metadata, slug };
    }),
  );
  return videos.sort(byDateDesc);
}

export async function getPillole(): Promise<Pillola[]> {
  "use cache";
  cacheLife("max");
  const slugs = await slugsIn("pillole");
  const pillole = await Promise.all(
    slugs.map(async (slug) => {
      const { metadata } = (await import(`@/content/pillole/${slug}.mdx`)) as {
        metadata: PillolaMeta;
      };
      return { ...metadata, slug };
    }),
  );
  return pillole.sort(byDateDesc);
}
