// Modulo senza import: lo usano next.config.ts, instrumentation.ts, lib/content-core.ts e `node --test`.

/**
 * Segnaposto per i dati che esistono solo dopo l'uscita del video su YouTube: l'ID (`youtubeId`) e
 * la data e ora di pubblicazione (`date`). Si scrive così com'è nel `metadata` dell'MDX, al posto del
 * valore che manca. Il video resta «in attesa» finché anche uno solo dei due è il segnaposto.
 * Per toglierlo basta sostituirlo nell'MDX con l'ID e la data veri.
 */
export const IN_ATTESA_DI_YOUTUBE = "IN_ATTESA_DI_YOUTUBE";

type Env = Record<string, string | undefined>;

/**
 * Il segnaposto è ammesso solo dove serve vedere la pagina prima dell'uscita: preview di Vercel
 * (`VERCEL_ENV=preview`, con target preview o assente) e `next dev`. Un target di produzione
 * (`VERCEL_ENV` o `VERCEL_TARGET_ENV` = `production`) ha sempre la precedenza. Ovunque altro, compreso
 * un `next build` o `next start` locale senza variabili, non è ammesso.
 */
export function pendingVideosAllowed(env: Env = process.env): boolean {
  if (env.VERCEL_ENV === "production" || env.VERCEL_TARGET_ENV === "production")
    return false;
  if (env.NODE_ENV === "development") return true;
  return (
    env.VERCEL_ENV === "preview" &&
    (env.VERCEL_TARGET_ENV ?? "preview") === "preview"
  );
}

/** Messaggio unico per tutti i punti che fermano un video in attesa fuori dalla preview. */
export function pendingVideosError(where: string, detail: string): Error {
  return new Error(
    `${where}: ${detail} ancora ${JSON.stringify(IN_ATTESA_DI_YOUTUBE)}. ` +
      "Il video non è ancora su YouTube: prima di andare in produzione sostituisci il segnaposto " +
      "con l'ID del video e con data e ora reali di pubblicazione, in ISO 8601 con fuso (AAAA-MM-GGThh:mm:ssZ). " +
      "Il segnaposto è ammesso solo nelle preview (VERCEL_ENV=preview) e in next dev.",
  );
}
