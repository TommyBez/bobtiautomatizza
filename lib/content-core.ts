// Parte del caricamento contenuti senza Next: la usa lib/content.ts e la esegue anche `node --test`
// (vedi content.test.ts). Qui restano fuori solo l'import degli MDX e la cache, che dipendono dal bundler.
import { readdir } from "node:fs/promises";
import path from "node:path";
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
   * Data e ora di pubblicazione su YouTube, ISO 8601 in UTC con "Z" (es. "2026-11-12T08:00:31Z")
   * o con l'offset di Europe/Rome. Il caricamento la valida: una data sbagliata ferma test e build.
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

/** Un file MDX letto: lo slug e il suo `export const metadata`. */
export type ContentEntry<Meta> = { slug: string; metadata: Meta };

const contentDir = path.join(process.cwd(), "content");

/** Slug dei file `.mdx` in `content/<folder>`. */
export async function slugsIn(folder: "video" | "pillole") {
  const files = await readdir(path.join(contentDir, folder));
  return files
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

/** Ordine delle liste del sito: dal più recente, per istante (con fusi diversi l'ordine alfabetico sbaglia). */
export function sortByDateDesc<T extends { date: IsoDateTime }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => toEpoch(b.date) - toEpoch(a.date));
}

/** Valida le date (vedi lib/datetime.ts) e ordina: è quello che restituisce `getVideos()`. */
export function toVideos(entries: ContentEntry<VideoMeta>[]): Video[] {
  return sortByDateDesc(
    entries.map(({ slug, metadata }) => ({
      ...withValidDate(metadata, `content/video/${slug}.mdx`),
      slug,
    })),
  );
}

/** Come `toVideos`, per le puntate del lunedì: è quello che restituisce `getPillole()`. */
export function toPillole(entries: ContentEntry<PillolaMeta>[]): Pillola[] {
  return sortByDateDesc(
    entries.map(({ slug, metadata }) => ({
      ...withValidDate(metadata, `content/pillole/${slug}.mdx`),
      slug,
    })),
  );
}
