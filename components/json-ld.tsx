/** Dati strutturati come raccomandato dalla guida JSON-LD di Next.js: `<` sostituito per evitare XSS. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: pattern della guida JSON-LD di Next.js, payload sanificato
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
