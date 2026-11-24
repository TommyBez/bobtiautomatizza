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

/**
 * Segnaposto per i dati che esistono solo dopo l'uscita del video su YouTube: l'ID (`youtubeId`) e
 * la data e ora di pubblicazione (`date`). Si scrive così com'è nel `metadata` dell'MDX, al posto del
 * valore che manca. Con il segnaposto la pagina va in preview senza player, senza data e senza
 * VideoObject; il build di produzione invece si ferma (vedi `pendingVideosAllowed`).
 * Per toglierlo basta sostituirlo nell'MDX con l'ID e la data veri.
 */
export const IN_ATTESA_DI_YOUTUBE = "IN_ATTESA_DI_YOUTUBE";

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

/**
 * Video caricato: `date` è già validata, quindi va direttamente nei dati strutturati.
 * `youtubeId` e `date` sono `null` se nell'MDX c'è ancora `IN_ATTESA_DI_YOUTUBE` (solo in preview).
 */
export type Video = Omit<VideoMeta, "date" | "youtubeId"> & {
  youtubeId: string | null;
  date: IsoDateTime | null;
  slug: string;
};

/** Video uscito su YouTube: ha ID e data veri, quindi player, data in pagina, VideoObject e lastmod. */
export type PublishedVideo = Video & { youtubeId: string; date: IsoDateTime };

export const isPublished = (video: Video): video is PublishedVideo =>
  video.youtubeId !== null && video.date !== null;

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

/**
 * Il segnaposto `IN_ATTESA_DI_YOUTUBE` è ammesso solo dove serve vedere la pagina prima dell'uscita:
 * preview di Vercel (`VERCEL_ENV=preview`) e `next dev`. Ovunque altro, compreso il build di produzione
 * su Vercel e un `next build` locale, il caricamento si ferma. Per un build di preview in locale:
 * `VERCEL_ENV=preview pnpm build`.
 */
export function pendingVideosAllowed(
  env: Record<string, string | undefined> = process.env,
) {
  return env.VERCEL_ENV === "preview" || env.NODE_ENV === "development";
}

function toVideo(
  { slug, metadata }: ContentEntry<VideoMeta>,
  allowPending: boolean,
): Video {
  const file = `content/video/${slug}.mdx`;
  const pending = (["youtubeId", "date"] as const).filter(
    (field) => metadata[field] === IN_ATTESA_DI_YOUTUBE,
  );
  if (pending.length > 0 && !allowPending) {
    throw new Error(
      `${file}: ${pending.join(" e ")} ancora ${JSON.stringify(IN_ATTESA_DI_YOUTUBE)}. ` +
        "Il video non è ancora su YouTube: prima di andare in produzione sostituisci il segnaposto " +
        "con l'ID del video e con data e ora reali di pubblicazione, in ISO 8601 con fuso (AAAA-MM-GGThh:mm:ssZ). " +
        "Il segnaposto è ammesso solo nelle preview (VERCEL_ENV=preview) e in next dev.",
    );
  }
  return {
    ...metadata,
    slug,
    youtubeId: pending.includes("youtubeId") ? null : metadata.youtubeId,
    date: pending.includes("date")
      ? null
      : parseIsoDateTime(metadata.date, `${file}: date`),
  };
}

/**
 * Valida le date (vedi lib/datetime.ts) e ordina: è quello che restituisce `getVideos()`.
 * Con `allowPending: false` (il default) un segnaposto `IN_ATTESA_DI_YOUTUBE` lancia un errore.
 */
export function toVideos(
  entries: ContentEntry<VideoMeta>[],
  { allowPending = false }: { allowPending?: boolean } = {},
): Video[] {
  return sortByDateDesc(entries.map((entry) => toVideo(entry, allowPending)));
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
