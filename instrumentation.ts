import {
  pendingVideosAllowed,
  pendingVideosError,
} from "./lib/pending-videos.ts";

/**
 * All'avvio del server: un build che contiene video IN_ATTESA_DI_YOUTUBE (elenco fissato da next.config.ts)
 * parte solo in preview o in sviluppo. Così il risultato di un build di preview non si può servire in
 * produzione, per esempio con `next start` e VERCEL_ENV=production.
 */
export function register() {
  const filesInAttesa = process.env.BOB_VIDEO_IN_ATTESA;
  if (filesInAttesa && !pendingVideosAllowed({ ...process.env })) {
    throw pendingVideosError(filesInAttesa, "youtubeId o date");
  }
}
