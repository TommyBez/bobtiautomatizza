import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import vm from "node:vm";
import { type IsoDateTime, toEpoch, withValidDate } from "./datetime.ts";
import { assertJsonLdDateTimes, videoObjectJsonLd } from "./json-ld.ts";

const contentDir = path.join(import.meta.dirname, "..", "content");

/**
 * `export const metadata = {…}` di un MDX, valutato come oggetto. Node non importa gli .mdx,
 * ma i metadati sono un letterale JavaScript: così il test legge i contenuti veri, come il sito.
 */
function readMetadata(file: string) {
  const source = readFileSync(path.join(contentDir, file), "utf8");
  const literal = /^export const metadata = (\{[\s\S]*?\n\});$/m.exec(
    source,
  )?.[1];
  assert.ok(literal, `${file}: export const metadata non trovato`);
  return vm.runInNewContext(`(${literal})`) as {
    title: string;
    description: string;
    youtubeId: string;
    date: string;
  };
}

const mdxIn = (folder: string) =>
  readdirSync(path.join(contentDir, folder))
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => `${folder}/${f}`);

const loadVideo = (slug: string) => {
  const file = `content/video/${slug}.mdx`;
  return withValidDate(readMetadata(`video/${slug}.mdx`), file);
};

// Stessi formati di lib/site.ts: il giorno si legge sempre in Europe/Rome.
const romeDay = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(
    new Date(iso),
  );
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Rome",
  }).format(new Date(iso));

const WITH_TIME_ZONE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// Le due pagine segnalate da Search Console il 20/11/2026: prima avevano solo il giorno.
for (const [slug, day, shown] of [
  ["claude-design", "2026-11-12", "12 novembre 2026"],
  ["cosa-e-una-skill", "2026-11-17", "17 novembre 2026"],
] as const) {
  test(`/video/${slug}: uploadDate con fuso e giorno ${day} a Roma`, () => {
    const jsonLd = videoObjectJsonLd(loadVideo(slug));
    assert.match(jsonLd.uploadDate, WITH_TIME_ZONE);
    assert.doesNotThrow(() => assertJsonLdDateTimes(jsonLd));
    assert.equal(romeDay(jsonLd.uploadDate), day);
    // La data mostrata in pagina resta quella di prima.
    assert.equal(formatDate(jsonLd.uploadDate), shown);
  });
}

test("ogni video e ogni puntata del lunedì ha una data valida con fuso", () => {
  const files = [...mdxIn("video"), ...mdxIn("pillole")];
  assert.ok(files.length >= 8);
  for (const file of files) {
    const { date } = withValidDate(readMetadata(file), `content/${file}`);
    assert.match(date, WITH_TIME_ZONE, file);
    assert.doesNotThrow(() =>
      assertJsonLdDateTimes(
        videoObjectJsonLd({ title: "", description: "", youtubeId: "x", date }),
      ),
    );
  }
});

test("l'ordine dei video resta dal più recente", () => {
  const slugs = mdxIn("video")
    .map((file) => path.basename(file, ".mdx"))
    .map((slug) => ({ slug, ...loadVideo(slug) }))
    .sort((a, b) => toEpoch(b.date) - toEpoch(a.date))
    .map((v) => v.slug);
  assert.deepEqual(slugs.slice(0, 5), [
    "cosa-e-una-skill",
    "claude-design",
    "grok-bot",
    "report-meta-ads-claude",
    "progetti-claude",
  ]);
});

test("il JSON-LD rifiuta un datetime senza fuso", () => {
  assert.throws(
    () =>
      assertJsonLdDateTimes(
        videoObjectJsonLd({
          title: "",
          description: "",
          youtubeId: "x",
          // @ts-expect-error: una stringa qualsiasi non è un IsoDateTime, quindi non passa il typecheck.
          date: "2026-11-12",
        }),
      ),
    { message: /JSON-LD\.uploadDate: "2026-11-12" non ha il fuso orario/ },
  );
});

test("il JSON-LD rifiuta un datetime non valido, a qualunque profondità", () => {
  const uploadDate = "2026-11-12T08:00:31Z" as IsoDateTime;
  assert.throws(
    () =>
      assertJsonLdDateTimes({ uploadDate, expires: "2026-11-31T00:00:00Z" }),
    { message: /JSON-LD\.expires: .* non è una data e ora esistente/ },
  );
  assert.throws(
    () =>
      assertJsonLdDateTimes({
        uploadDate,
        publication: [{ "@type": "BroadcastEvent", startDate: "domani" }],
      }),
    { message: /JSON-LD\.publication\[0\]\.startDate/ },
  );
  // Le proprietà che non sono datetime non vengono toccate.
  assert.doesNotThrow(() =>
    assertJsonLdDateTimes({
      "@type": "Person",
      name: "2026-11-12",
      birthDate: "1990-01-01",
    }),
  );
});
