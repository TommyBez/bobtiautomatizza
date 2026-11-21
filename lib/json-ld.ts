// Modulo senza import di Next o React: lo esegue anche `node --test` (vedi json-ld.test.ts).
import {
  type IsoDateTime,
  isoDateFormat,
  looksLikeIsoDateTime,
  parseIsoDate,
  parseIsoDateTime,
} from "./datetime.ts";
import { schemaDateTimeProperties } from "./schema-datetime.ts";

/** Il JSON-LD così come viene scritto nella pagina: solo valori JSON, dopo ogni `toJSON()`. */
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

/**
 * Proprietà che la guida di Google tratta come DateTime anche se schema.org ammetterebbe una sola data.
 * Fonte: https://developers.google.com/search/docs/appearance/structured-data/video
 * - VideoObject: `uploadDate`, `expires`;
 * - il BroadcastEvent dentro `VideoObject.publication` (badge LIVE): `startDate`, `endDate`.
 * Un BroadcastEvent autonomo resta alle regole di schema.org, che per startDate ammettono una data.
 */
const videoObjectDateTimes = new Set(["uploadDate", "expires"]);
const liveBroadcastDateTimes = new Set(["startDate", "endDate"]);

/** Datatype JSON-LD di un oggetto valore `{"@value": …, "@type": …}`. */
const dateTimeDatatypes = new Set([
  "xsd:dateTime",
  "http://www.w3.org/2001/XMLSchema#dateTime",
  "DateTime",
]);
const dateDatatypes = new Set([
  "xsd:date",
  "http://www.w3.org/2001/XMLSchema#date",
  "Date",
]);

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

const isObject = (value: Json): value is JsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function typesOf(node: JsonObject): string[] {
  const type = node["@type"];
  const types = Array.isArray(type) ? type : [type];
  return types.filter((t) => typeof t === "string").map(schemaName);
}

type Rule = {
  /** true = serve un DateTime; false = lo schema ammette anche Date, Time, Text, ecc. */
  strict: boolean;
  allowsDate: boolean;
};

/** Valore scalare di una proprietà DateTime (vedi la regola in `serializeJsonLd`). */
function checkScalar(value: Json, rule: Rule, path: string) {
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
}

/** Oggetto valore `{"@value": …}`: un datatype esplicito DateTime o Date vale più della regola della proprietà. */
function checkValueObject(
  node: JsonObject,
  rule: Rule | undefined,
  path: string,
) {
  const value = node["@value"];
  const datatype =
    typeof node["@type"] === "string" ? schemaName(node["@type"]) : "";
  const at = `${path}.@value`;
  if (dateTimeDatatypes.has(datatype)) {
    parseIsoDateTime(value, at);
  } else if (dateDatatypes.has(datatype) && !rule?.strict) {
    if (typeof value !== "string") parseIsoDateTime(value, at); // errore: non è una stringa
    parseIsoDate(value as string, at);
  } else if (rule) {
    checkScalar(value, rule, at);
  }
}

/** Valore di una proprietà DateTime: scalare, array di valori o oggetto valore. */
function checkProperty(value: Json, rule: Rule, path: string) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      checkProperty(item, rule, `${path}[${i}]`);
    });
  } else if (isObject(value) && "@value" in value) {
    checkValueObject(value, rule, path);
  } else if (isObject(value) && !rule.strict) {
    visitNode(value, path, false); // un nodo dove lo schema ammette anche altro: si controlla il suo interno
  } else {
    checkScalar(value, rule, path); // dove serve un DateTime, anche null, numeri e nodi sono errori
  }
}

function visitValue(value: Json, path: string, inVideoPublication: boolean) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      visitValue(item, `${path}[${i}]`, inVideoPublication);
    });
  } else if (isObject(value)) {
    visitNode(value, path, inVideoPublication);
  }
}

function visitNode(
  node: JsonObject,
  path: string,
  inVideoPublication: boolean,
) {
  if ("@value" in node) {
    checkValueObject(node, undefined, path);
    return;
  }
  const types = typesOf(node);
  const isVideo = types.includes("VideoObject");
  const googleDateTimes = new Set([
    ...(isVideo ? videoObjectDateTimes : []),
    ...(inVideoPublication && types.includes("BroadcastEvent")
      ? liveBroadcastDateTimes
      : []),
  ]);
  for (const [key, value] of Object.entries(node)) {
    const at = `${path}.${key}`;
    if (key === "@context" || key === "@type" || key === "@id") continue;
    const property = schemaName(key);
    if (Object.hasOwn(schemaDateTimeProperties, property)) {
      const others = schemaDateTimeProperties[property];
      const rule = {
        strict: others.length === 0 || googleDateTimes.has(property),
        allowsDate: others.includes("Date"),
      };
      checkProperty(value, rule, at);
    } else {
      visitValue(value, at, isVideo && property === "publication");
    }
  }
}

/**
 * Serializza il JSON-LD per lo `<script type="application/ld+json">`, con `<` sostituito per evitare XSS
 * (come nella guida JSON-LD di Next.js), e lo controlla prima di restituirlo.
 *
 * Il controllo legge il JSON **effettivamente emesso** (serializzato e riletto con JSON.parse), quindi vede
 * tipi e valori dopo ogni `toJSON()`, gli `undefined` negli array diventati `null`, le date già convertite.
 * Copre tutte le proprietà schema.org che ammettono un DateTime, a qualunque profondità e anche in forma
 * estesa ("https://schema.org/uploadDate"):
 * - dove serve un DateTime (unico tipo ammesso da schema.org, o DateTime per Google) deve esserci
 *   un `IsoDateTime`: data, ora e fuso validi;
 * - dove lo schema ammette anche altro, un valore scritto come datetime deve comunque essere completo,
 *   una data `AAAA-MM-GG` deve esistere, e i valori Time, Text, URL o numerici restano liberi;
 * - un oggetto valore con datatype esplicito (`"@type": "xsd:dateTime"`) deve rispettarlo, ovunque sia.
 * Un valore sbagliato lancia un errore con il percorso, es. `JSON-LD.publication[0].startDate`.
 */
export function serializeJsonLd(data: object): string {
  const json = JSON.stringify(data);
  if (typeof json !== "string")
    throw new Error("JSON-LD: il valore non è serializzabile");
  visitValue(JSON.parse(json) as Json, "JSON-LD", false);
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
