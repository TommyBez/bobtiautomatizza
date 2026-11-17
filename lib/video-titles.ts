// Modulo senza import: lo esegue anche `node --test` (vedi video-titles.test.ts).

/** Forma di confronto: ignora maiuscole, spazi e apostrofi tipografici. */
function comparable(text: string) {
  return text
    .normalize("NFKC")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("it");
}

/**
 * Il sottotitolo «Dal video «…»» si mostra solo se aggiunge qualcosa:
 * quando il titolo YouTube è lo stesso della pagina lo ripeterebbe.
 */
export function showsYoutubeTitle(video: {
  title: string;
  youtubeTitle: string;
}) {
  return comparable(video.youtubeTitle) !== comparable(video.title);
}
