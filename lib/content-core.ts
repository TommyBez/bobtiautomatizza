// Parte del caricamento contenuti senza Next: la usa lib/content.ts e la esegue anche `node --test`
// (vedi content.test.ts). Qui restano fuori solo l'import degli MDX e la cache, che dipendono dal bundler.
import { readdir } from "node:fs/promises";
import path from "node:path";
import {
  type IsoDateTime,
  parseIsoDateTime,
  toEpoch,
  withValidDate,
} from "./datetime.ts";
import {
  IN_ATTESA_DI_YOUTUBE,
  pendingVideosAllowed,
  pendingVideosError,
} from "./pending-videos.ts";

export { IN_ATTESA_DI_YOUTUBE, pendingVideosAllowed };

/** Un video divulgativo. I metadati stanno in `export const metadata` dentro `content/video/<slug>.mdx`. */
export type VideoMeta = {
  /** Titolo della pagina, scritto come una ricerca su Google. */
  title: string;
  /** Titolo del video su YouTube, mostrato come sottotitolo. */
  youtubeTitle: string;
  /** ID del video su YouTube, oppure `IN_ATTESA_DI_YOUTUBE` finché il video non è uscito. */
  youtubeId: string;
  /** "short" = verticale 9:16, "long" = orizzontale 16:9. */
  format: "short" | "long";
  /**
   * Data e ora di pubblicazione su YouTube, ISO 8601 in UTC con "Z" (es. "2026-11-12T08:00:31Z")
   * o con l'offset di Europe/Rome. Il caricamento la valida: una data sbagliata ferma test e build.
   * Finché il video non è uscito: `IN_ATTESA_DI_YOUTUBE`.
   */
  date: string;
  description: string;
  inBreve: string[];
  /** Etichette libere: diventano pagine argomento solo da 3 video in su. */
  topics: string[];
  tools: string[];
};

type VideoBase = Omit<VideoMeta, "date" | "youtubeId"> & { slug: string };

/** Video uscito su YouTube: ID e data validati, quindi player, data in pagina, VideoObject e lastmod. */
export type PublishedVideo = VideoBase & {
  youtubeId: string;
  date: IsoDateTime;
};

/**
 * Video in attesa di YouTube (nell'MDX c'è ancora `IN_ATTESA_DI_YOUTUBE` in `youtubeId` o in `date`):
 * esiste solo in preview, senza ID e senza data finché non ci sono entrambi.
 */
export type PendingVideo = VideoBase & { youtubeId: null; date: null };

/** Video caricato: `date` è già validata, quindi va direttamente nei dati strutturati. */
export type Video = PublishedVideo | PendingVideo;

export const isPublished = (video: Video): video is PublishedVideo =>
  video.date !== null;

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

/**
 * Ordine delle liste del sito: dal più recente, per istante (con fusi diversi l'ordine alfabetico sbaglia).
 * Un video senza data (in attesa di YouTube) esce dopo tutti gli altri, quindi va in testa.
 */
export function sortByDateDesc<T extends { date: IsoDateTime | null }>(
  items: T[],
): T[] {
  const epoch = (item: T) =>
    item.date === null ? Number.POSITIVE_INFINITY : toEpoch(item.date);
  return [...items].sort((a, b) => {
    const [ea, eb] = [epoch(a), epoch(b)];
    return ea === eb ? 0 : eb > ea ? 1 : -1; // Infinity - Infinity darebbe NaN
  });
}

/** ID di un video YouTube: 11 caratteri tra lettere, cifre, "-" e "_". */
const youtubeIdFormat = /^[A-Za-z0-9_-]{11}$/;

function toVideo(
  { slug, metadata }: ContentEntry<VideoMeta>,
  env: Record<string, string | undefined>,
): Video {
  const file = `content/video/${slug}.mdx`;
  const pending = (["youtubeId", "date"] as const).filter(
    (field) => metadata[field] === IN_ATTESA_DI_YOUTUBE,
  );
  // Anche in attesa, il dato già scritto deve essere valido: un refuso non aspetta la pubblicazione.
  if (
    !pending.includes("youtubeId") &&
    !youtubeIdFormat.test(String(metadata.youtubeId))
  ) {
    throw new Error(
      `${file}: youtubeId ${JSON.stringify(metadata.youtubeId)} non è un ID YouTube ` +
        `(11 caratteri tra lettere, cifre, "-" e "_"). Se il video non è ancora uscito: ` +
        `${JSON.stringify(IN_ATTESA_DI_YOUTUBE)}.`,
    );
  }
  const date = pending.includes("date")
    ? null
    : parseIsoDateTime(metadata.date, `${file}: date`);
  if (pending.length === 0 && date !== null) {
    return { ...metadata, slug, date };
  }
  if (!pendingVideosAllowed(env)) {
    throw pendingVideosError(file, pending.join(" e "));
  }
  return { ...metadata, slug, youtubeId: null, date: null };
}

/**
 * Valida ID e date e ordina: è quello che restituisce `getVideos()`. Un video con il segnaposto
 * `IN_ATTESA_DI_YOUTUBE` lancia un errore se l'ambiente (`env`, di default quello del processo) non è
 * una preview: è questo che ferma il build di produzione (vedi lib/pending-videos.ts).
 */
export function toVideos(
  entries: ContentEntry<VideoMeta>[],
  env: Record<string, string | undefined> = process.env,
): Video[] {
  return sortByDateDesc(entries.map((entry) => toVideo(entry, env)));
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
