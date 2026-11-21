// Modulo senza import: lo esegue anche `node --test` (vedi datetime.test.ts).

declare const isoDateTimeBrand: unique symbol;

/**
 * Data e ora ISO 8601 complete di fuso: in UTC con "Z" (es. "2026-11-12T08:00:31Z") oppure con l'offset
 * che Europe/Rome ha in quell'istante (es. "2026-11-12T09:00:31+01:00", "2026-07-12T10:00:31+02:00").
 * Una stringa diventa `IsoDateTime` solo passando da `parseIsoDateTime`, quindi un valore di questo
 * tipo è sempre valido: è il formato che Google chiede per `uploadDate` e gli altri datetime dello schema.
 */
export type IsoDateTime = string & { readonly [isoDateTimeBrand]: true };

/** Fuso di riferimento del sito: gli offset ammessi sono solo i suoi (+01:00 d'inverno, +02:00 d'estate). */
export const SITE_TIME_ZONE = "Europe/Rome";

// Unica definizione del formato, usata dal parser, dai controlli del JSON-LD e dai test.
// Anno a 4 cifre; secondi facoltativi; frazione di secondo da 1 a 3 cifre, solo dopo i secondi.
const DATE = String.raw`(\d{4})-(\d{2})-(\d{2})`;
const TIME = String.raw`(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?`;
const ZONE = String.raw`(?:Z|([+-])(\d{2}):(\d{2}))`;

/** Data e ora con fuso: `AAAA-MM-GGThh:mm[:ss[.sss]]` seguito da `Z` o `±hh:mm`. */
export const isoDateTimeFormat = new RegExp(`^${DATE}T${TIME}${ZONE}$`);
/** Data di calendario senza ora: `AAAA-MM-GG`. */
export const isoDateFormat = new RegExp(`^${DATE}$`);
/** Inizia come un datetime (data seguita da "T"): va validato come tale anche dove lo schema ammette altro. */
export const looksLikeIsoDateTime = new RegExp(`^${DATE}T`);
const missingZone = new RegExp(`^${DATE}(?:T${TIME})?$`);

const romeOffsetFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE_TIME_ZONE,
  timeZoneName: "longOffset",
});

/** Offset di Europe/Rome, in minuti, nell'istante `epoch` (ms). */
function romeOffsetMinutes(epoch: number) {
  const name =
    romeOffsetFormat.formatToParts(epoch).find((p) => p.type === "timeZoneName")
      ?.value ?? "";
  const m = /^GMT(?:([+-])(\d{2}):(\d{2}))?$/.exec(name);
  if (!m) throw new Error(`Offset di ${SITE_TIME_ZONE} non leggibile: ${name}`);
  const minutes = Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  return m[1] === "-" ? -minutes : minutes;
}

function formatOffset(minutes: number) {
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${minutes < 0 ? "-" : "+"}${hh}:${mm}`;
}

/** Millisecondi dell'ora "da orologio" letta come se fosse UTC, o NaN se data o ora non esistono. */
function wallClock(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
) {
  const d = new Date(0);
  // setUTCFullYear e non Date.UTC, che sposta gli anni 0–99 nel Novecento.
  d.setUTCFullYear(year, month - 1, day);
  d.setUTCHours(hour, minute, second, ms);
  // I valori fuori scala vengono normalizzati (31 novembre → 1° dicembre): se non tornano, non esistono.
  const exists =
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day &&
    d.getUTCHours() === hour &&
    d.getUTCMinutes() === minute &&
    d.getUTCSeconds() === second;
  return exists ? d.getTime() : Number.NaN;
}

function invalid(value: unknown, where: string, why: string): never {
  throw new Error(
    `${where}: ${JSON.stringify(value)} ${why}. ` +
      `Serve data e ora ISO 8601 in UTC con "Z" (es. "2026-11-12T08:00:31Z") ` +
      `o con l'offset di ${SITE_TIME_ZONE} in quell'istante (es. "2026-11-12T09:00:31+01:00").`,
  );
}

/** Ultima garanzia: ogni valore accettato corrisponde a un istante, quindi `toEpoch` non dà mai NaN. */
function withInstant(value: string, where: string): IsoDateTime {
  if (Number.isNaN(Date.parse(value))) {
    invalid(value, where, "non corrisponde a un istante valido");
  }
  return value as IsoDateTime;
}

/**
 * Restituisce `value` come `IsoDateTime` oppure lancia un errore che indica `where`
 * (es. il file del contenuto). Rifiuta: date senza ora o senza fuso, date e ore inesistenti,
 * `-00:00`, offset con minuti fuori scala, offset scritti diversamente da quello di Europe/Rome in quell'istante, e le ore locali che sul cambio
 * d'ora non esistono (29 marzo 2026, 02:00–02:59) o sono ambigue (25 ottobre 2026, 02:00–02:59).
 */
export function parseIsoDateTime(value: unknown, where: string): IsoDateTime {
  if (typeof value !== "string") invalid(value, where, "non è una stringa");
  const m = isoDateTimeFormat.exec(value);
  if (!m) {
    if (missingZone.test(value)) invalid(value, where, "non ha il fuso orario");
    invalid(value, where, "non è un datetime ISO 8601");
  }
  const [year, month, day, hour, minute, second] = [1, 2, 3, 4, 5, 6].map((i) =>
    Number(m[i] ?? 0),
  );
  const ms = Number((m[7] ?? "0").padEnd(3, "0"));
  const local = wallClock(year, month, day, hour, minute, second, ms);
  if (Number.isNaN(local)) {
    invalid(value, where, "non è una data e ora esistente");
  }
  const [sign, offsetHours, offsetMinutes] = [m[8], m[9], m[10]];
  if (sign === undefined) return withInstant(value, where); // "Z": è già un istante

  const written = `${sign}${offsetHours}:${offsetMinutes}`;
  if (Number(offsetMinutes) > 59) {
    invalid(
      value,
      where,
      `ha un offset non valido (${written}): i minuti vanno da 00 a 59`,
    );
  }
  if (written === "-00:00") {
    invalid(
      value,
      where,
      'usa "-00:00", che in RFC 3339 vuol dire fuso sconosciuto',
    );
  }
  // Gli offset di Roma attorno a quell'ora (24 ore prima e dopo coprono qualsiasi cambio d'ora),
  // e tra questi quelli per cui quell'ora locale esiste davvero.
  const around = new Set([
    romeOffsetMinutes(local - 86_400_000),
    romeOffsetMinutes(local + 86_400_000),
  ]);
  const matching = [...around].filter(
    (o) => romeOffsetMinutes(local - o * 60_000) === o,
  );
  if (matching.length === 0) {
    invalid(
      value,
      where,
      `è un'ora che a Roma non esiste (cambio d'ora): usa l'UTC con "Z"`,
    );
  }
  if (matching.length > 1) {
    invalid(
      value,
      where,
      `è un'ora che a Roma è ambigua (cambio d'ora): usa l'UTC con "Z"`,
    );
  }
  // Confronto testuale con la forma canonica: "+00:60" vale +01:00 ma non è un offset ISO 8601 valido.
  const expected = formatOffset(matching[0]);
  if (written !== expected) {
    invalid(
      value,
      where,
      `ha offset ${written}, ma a Roma in quell'istante è ${expected}`,
    );
  }
  return withInstant(value, where);
}

/** Restituisce `value` se è una data di calendario esistente (`AAAA-MM-GG`), altrimenti lancia un errore. */
export function parseIsoDate(value: string, where: string): string {
  const m = isoDateFormat.exec(value);
  if (!m || Number.isNaN(wallClock(Number(m[1]), Number(m[2]), Number(m[3])))) {
    throw new Error(
      `${where}: ${JSON.stringify(value)} non è una data esistente (AAAA-MM-GG).`,
    );
  }
  return value;
}

/** Istante in millisecondi: per ordinare datetime con fusi diversi non basta confrontare le stringhe. */
export const toEpoch = (value: IsoDateTime) => Date.parse(value);

/**
 * Porta i metadati di un contenuto MDX al tipo caricato, validando `date`. La usa lib/content-core.ts:
 * è l'unico punto da cui le date dei contenuti arrivano alle pagine, al JSON-LD e alla sitemap.
 */
export function withValidDate<T extends { date: string }>(
  metadata: T,
  file: string,
): Omit<T, "date"> & { date: IsoDateTime } {
  return {
    ...metadata,
    date: parseIsoDateTime(metadata.date, `${file}: date`),
  };
}
