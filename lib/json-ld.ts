// Modulo senza import di Next o React: lo esegue anche `node --test` (vedi json-ld.test.ts).
import { type IsoDateTime, parseIsoDateTime } from "./datetime.ts";

/**
 * Proprietà schema.org di tipo DateTime che Google legge nei dati strutturati. Nel nostro JSON-LD
 * devono essere sempre data e ora ISO 8601 con fuso: `assertJsonLdDateTimes` le controlla tutte,
 * anche quelle che oggi non usiamo, così un datetime aggiunto in futuro non sfugge.
 * Restano fuori le date di calendario pure (es. `birthDate`), che non hanno un'ora.
 */
export const jsonLdDateTimeProperties = new Set([
  "uploadDate",
  "expires",
  "datePublished",
  "dateModified",
  "dateCreated",
  "startDate",
  "endDate",
  "startTime",
  "endTime",
  "validFrom",
  "validThrough",
  "priceValidUntil",
  "availabilityStarts",
  "availabilityEnds",
]);

/** Lancia un errore se una proprietà datetime, a qualunque profondità, non è ISO 8601 con fuso. */
export function assertJsonLdDateTimes(data: unknown, path = "JSON-LD"): void {
  if (Array.isArray(data)) {
    data.forEach((item, i) => {
      assertJsonLdDateTimes(item, `${path}[${i}]`);
    });
    return;
  }
  if (data === null || typeof data !== "object") return;
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (jsonLdDateTimeProperties.has(key)) {
      parseIsoDateTime(value, `${path}.${key}`);
    } else {
      assertJsonLdDateTimes(value, `${path}.${key}`);
    }
  }
}

/** VideoObject come lo chiede Google: i datetime accettano solo `IsoDateTime`, non stringhe qualsiasi. */
export type VideoObjectJsonLd = {
  "@context": "https://schema.org";
  "@type": "VideoObject";
  name: string;
  description: string;
  thumbnailUrl: string[];
  uploadDate: IsoDateTime;
  expires?: IsoDateTime;
  embedUrl: string;
  contentUrl: string;
  inLanguage: string;
};

/**
 * VideoObject di una pagina /video/<slug>. `video.date` arriva già validata dal caricamento
 * dei contenuti (lib/content.ts), quindi `uploadDate` ha sempre data, ora e fuso.
 */
export function videoObjectJsonLd(
  video: {
    title: string;
    description: string;
    youtubeId: string;
    date: IsoDateTime;
  },
  /** Copertine ufficiali da mettere prima della miniatura di YouTube. */
  coverUrls: string[] = [],
): VideoObjectJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: [
      ...coverUrls,
      `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`,
    ],
    uploadDate: video.date,
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.youtubeId}`,
    contentUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
    inLanguage: "it",
  };
}
