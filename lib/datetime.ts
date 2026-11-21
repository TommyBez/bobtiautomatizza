// Modulo senza import: lo esegue anche `node --test` (vedi datetime.test.ts).

declare const isoDateTimeBrand: unique symbol;

/**
 * Data e ora ISO 8601 complete di fuso, es. "2026-11-12T08:00:31Z" o "2026-11-12T09:00:31+01:00".
 * Una stringa diventa `IsoDateTime` solo passando da `parseIsoDateTime`, quindi un valore di questo
 * tipo è sempre valido: è il formato che Google chiede per `uploadDate` e gli altri datetime dello schema.
 */
export type IsoDateTime = string & { readonly [isoDateTimeBrand]: true };

// Data, "T", ore e minuti (secondi e frazioni facoltativi) e fuso obbligatorio: "Z" o "±hh:mm".
const ISO_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|([+-])(\d{2}):(\d{2}))$/;

function invalid(value: unknown, where: string, why: string): never {
  throw new Error(
    `${where}: ${JSON.stringify(value)} ${why}. ` +
      'Serve data e ora ISO 8601 con fuso, es. "2026-11-12T08:00:31Z" o "2026-11-12T09:00:31+01:00".',
  );
}

/**
 * Restituisce `value` come `IsoDateTime` oppure lancia un errore che indica `where`
 * (es. il file del contenuto). Rifiuta le date senza ora o senza fuso e le date inesistenti.
 */
export function parseIsoDateTime(value: unknown, where: string): IsoDateTime {
  if (typeof value !== "string") invalid(value, where, "non è una stringa");
  const m = ISO_DATE_TIME.exec(value);
  if (!m) {
    if (/^\d{4}-\d{2}-\d{2}(T[\d:.]+)?$/.test(value)) {
      invalid(value, where, "non ha il fuso orario");
    }
    invalid(value, where, "non è un datetime ISO 8601");
  }
  const [year, month, day, hour, minute, second, offsetHours, offsetMinutes] = [
    1, 2, 3, 4, 5, 6, 9, 10,
  ].map((i) => Number(m[i] ?? 0));
  // Date.UTC normalizza i valori fuori scala (31 novembre → 1° dicembre): se non torna uguale, la data non esiste.
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const exists =
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day &&
    utc.getUTCHours() === hour &&
    utc.getUTCMinutes() === minute &&
    utc.getUTCSeconds() === second;
  // I fusi reali vanno da -12:00 a +14:00; qui basta escludere i valori impossibili.
  const offsetOk =
    offsetMinutes <= 59 && offsetHours * 60 + offsetMinutes <= 14 * 60;
  if (!exists || !offsetOk)
    invalid(value, where, "non è una data e ora esistente");
  return value as IsoDateTime;
}

/** Istante in millisecondi: per ordinare datetime con fusi diversi non basta confrontare le stringhe. */
export const toEpoch = (value: IsoDateTime) => Date.parse(value);

/**
 * Porta i metadati di un contenuto MDX al tipo caricato, validando `date`. La usa lib/content.ts:
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
