import { serializeJsonLd } from "@/lib/json-ld";

/**
 * Dati strutturati come raccomandato dalla guida JSON-LD di Next.js: `<` sostituito per evitare XSS.
 * Un datetime senza fuso o non valido (es. `uploadDate`, `expires`) blocca il rendering, quindi la build.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: pattern della guida JSON-LD di Next.js, payload sanificato
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
