// Modulo senza import di Next o React: lo esegue anche `node --test` (vedi json-ld.test.ts).
import {
  type IsoDateTime,
  isoDateFormat,
  looksLikeIsoDateTime,
  parseIsoDate,
  parseIsoDateTime,
} from "./datetime.ts";
import { schemaDateTimeProperties } from "./schema-datetime.ts";

/**
 * Proprietà che le guide di Google trattano come DateTime per un certo tipo, anche se schema.org
 * ammetterebbe una sola data. Fonte: https://developers.google.com/search/docs/appearance/structured-data/video
 * (`uploadDate`, `expires`; `publication` di tipo BroadcastEvent con `startDate`, `endDate`).
 */
const googleDateTimeProperties: Readonly<Record<string, ReadonlySet<string>>> =
  {
    VideoObject: new Set(["uploadDate", "expires"]),
    BroadcastEvent: new Set(["startDate", "endDate"]),
  };

/** "https://schema.org/uploadDate", "http://schema.org/uploadDate" e "schema:uploadDate" → "uploadDate". */
function schemaName(name: string) {
  for (const prefix of [
    "https://schema.org/",
    "http://schema.org/",
    "schema:",
  ]) {
    if (name.startsWith(prefix)) return name.slice(prefix.length);
  }
  return name;
}

function typesOf(node: unknown): string[] {
  if (node === null || typeof node !== "object") return [];
  const type = (node as Record<string, unknown>)["@type"];
  const types = Array.isArray(type) ? type : [type];
  return types.filter((t) => typeof t === "string").map(schemaName);
}

type DateTimeRule = {
  /** true = serve un DateTime; false = lo schema ammette anche Date, Time, Text, ecc. */
  strict: boolean;
  allowsDate: boolean;
};

function ruleFor(holder: unknown, key: string): DateTimeRule | undefined {
  const property = schemaName(key);
  if (!Object.hasOwn(schemaDateTimeProperties, property)) return undefined;
  const others = schemaDateTimeProperties[property];
  const strict =
    others.length === 0 ||
    typesOf(holder).some((t) => googleDateTimeProperties[t]?.has(property));
  return { strict, allowsDate: others.includes("Date") };
}

const isObject = (value: unknown): value is object =>
  value !== null && typeof value === "object";

/**
 * Controlla un valore di una proprietà DateTime:
 * - dove serve un DateTime (solo DateTime per schema.org, o DateTime per Google), deve essere `IsoDateTime`;
 * - dove lo schema ammette anche altro, un valore che inizia come un datetime deve essere completo e valido,
 *   una data `AAAA-MM-GG` deve esistere, e i valori Time, Text, URL o numerici restano liberi.
 * Restituisce true se il valore è un contenitore (array o `{"@value": …}`) i cui elementi vanno controllati.
 */
function checkValue(value: unknown, rule: DateTimeRule, path: string): boolean {
  if (
    value === undefined ||
    typeof value === "function" ||
    typeof value === "symbol"
  ) {
    return false; // JSON.stringify non li scrive
  }
  if (Array.isArray(value) || (isObject(value) && "@value" in value))
    return true;
  if (
    rule.strict ||
    (typeof value === "string" && looksLikeIsoDateTime.test(value))
  ) {
    parseIsoDateTime(value, path);
  } else if (
    rule.allowsDate &&
    typeof value === "string" &&
    isoDateFormat.test(value)
  ) {
    parseIsoDate(value, path);
  }
  return false;
}

/**
 * Serializza il JSON-LD per lo `<script type="application/ld+json">`, con `<` sostituito per evitare XSS
 * (come nella guida JSON-LD di Next.js). Prima di scrivere ogni valore controlla tutte le proprietà
 * schema.org che ammettono un DateTime, a qualunque profondità e anche in forma estesa
 * ("https://schema.org/uploadDate"). Il controllo gira dentro il replacer di JSON.stringify, quindi vede
 * il valore effettivamente serializzato, cioè dopo un eventuale `toJSON()`. Un valore sbagliato lancia
 * un errore con il percorso, es. `JSON-LD.publication[0].startDate`.
 */
export function serializeJsonLd(data: object): string {
  const paths = new WeakMap<object, string>();
  // Array e oggetti `{"@value": …}` che sono il valore di una proprietà DateTime: i loro elementi
  // si controllano quando il replacer li visita, cioè anche loro dopo `toJSON()`.
  const containers = new WeakMap<object, DateTimeRule>();

  const json = JSON.stringify(
    data,
    function (this: unknown, key: string, value: unknown) {
      const holder = this as object;
      const parent = paths.get(holder) ?? "JSON-LD";
      const path =
        key === ""
          ? "JSON-LD"
          : Array.isArray(holder)
            ? `${parent}[${key}]`
            : `${parent}.${key}`;

      const inherited = containers.get(holder);
      const rule =
        inherited && (Array.isArray(holder) || key === "@value")
          ? inherited
          : key !== "" && !Array.isArray(holder)
            ? ruleFor(holder, key)
            : undefined;
      if (rule && checkValue(value, rule, path) && isObject(value)) {
        containers.set(value, rule);
      }
      if (isObject(value)) paths.set(value, path);
      return value;
    },
  );
  return json.replace(/</g, "\\u003c");
}

/** Lancia un errore se una proprietà DateTime, a qualunque profondità, non è valida (vedi `serializeJsonLd`). */
export function assertJsonLdDateTimes(data: object): void {
  serializeJsonLd(data);
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
  contentReferenceTime?: IsoDateTime;
  embedUrl: string;
  contentUrl: string;
  inLanguage: string;
};

/**
 * VideoObject di una pagina /video/<slug>. `video.date` arriva già validata dal caricamento
 * dei contenuti (lib/content-core.ts), quindi `uploadDate` ha sempre data, ora e fuso.
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
