import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { type IsoDateTime, toEpoch, withValidDate } from "./datetime.ts";

/** Un video divulgativo. I metadati stanno in `export const metadata` dentro `content/video/<slug>.mdx`. */
export type VideoMeta = {
  /** Titolo della pagina, scritto come una ricerca su Google. */
  title: string;
  /** Titolo del video su YouTube, mostrato come sottotitolo. */
  youtubeTitle: string;
  youtubeId: string;
  /** "short" = verticale 9:16, "long" = orizzontale 16:9. */
  format: "short" | "long";
  /**
   * Data e ora di pubblicazione su YouTube, ISO 8601 con fuso (es. "2026-11-12T08:00:31Z").
   * Il caricamento la valida: una data senza ora o senza fuso ferma test e build.
   */
  date: string;
  description: string;
  inBreve: string[];
  /** Etichette libere: diventano pagine argomento solo da 3 video in su. */
  topics: string[];
  tools: string[];
};

/** Video caricato: `date` è già validata, quindi va direttamente nei dati strutturati. */
export type Video = Omit<VideoMeta, "date"> & {
  date: IsoDateTime;
  slug: string;
};

export type PillolaMeta = {
  title: string;
  youtubeTitle: string;
  youtubeId: string;
  format: "short" | "long";
  /** Come `VideoMeta.date`: data e ora ISO 8601 con fuso, validata al caricamento. */
  date: string;
  /** Settimana coperta, es. "30 ottobre – 6 novembre 2026". */
  period: string;
  items: { title: string; text?: string; source?: string }[];
};

export type Pillola = Omit<PillolaMeta, "date"> & {
  date: IsoDateTime;
  slug: string;
};

const contentDir = path.join(process.cwd(), "content");

async function slugsIn(folder: string) {
  const files = await readdir(path.join(contentDir, folder));
  return files
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

// Per istante, non per stringa: con fusi diversi l'ordine alfabetico non è quello cronologico.
const byDateDesc = (a: { date: IsoDateTime }, b: { date: IsoDateTime }) =>
  toEpoch(b.date) - toEpoch(a.date);

export async function getVideos(): Promise<Video[]> {
  "use cache";
  cacheLife("max");
  const slugs = await slugsIn("video");
  const videos = await Promise.all(
    slugs.map(async (slug) => {
      const { metadata } = (await import(`@/content/video/${slug}.mdx`)) as {
        metadata: VideoMeta;
      };
      return { ...withValidDate(metadata, `content/video/${slug}.mdx`), slug };
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
      return {
        ...withValidDate(metadata, `content/pillole/${slug}.mdx`),
        slug,
      };
    }),
  );
  return pillole.sort(byDateDesc);
}
