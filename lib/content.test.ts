import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { evaluate } from "@mdx-js/mdx";
// Il serializzatore che Next usa per sitemap.xml (API interna: se cambia con un aggiornamento, va aggiornato qui).
import { resolveSitemap } from "next/dist/build/webpack/loaders/metadata/resolve-route-data.js";
import * as runtime from "react/jsx-runtime";
import {
  type ContentEntry,
  type PillolaMeta,
  slugsIn,
  sortByDateDesc,
  toPillole,
  toVideos,
  type VideoMeta,
} from "./content-core.ts";
import { isoDateTimeFormat, parseIsoDateTime, toEpoch } from "./datetime.ts";
import { serializeJsonLd, videoObjectJsonLd } from "./json-ld.ts";
import { formatDate, site } from "./site.ts";
import { buildSitemap } from "./sitemap.ts";

/**
 * Legge `content/<folder>` come fa lib/content.ts: stessi slug (slugsIn) e MDX compilati con
 * @mdx-js/mdx, lo stesso compilatore che usa @next/mdx. Del sito restano fuori solo bundler e cache.
 */
async function loadEntries<Meta>(folder: "video" | "pillole") {
  const slugs = await slugsIn(folder);
  return Promise.all(
    slugs.map(async (slug): Promise<ContentEntry<Meta>> => {
      const file = path.join(process.cwd(), "content", folder, `${slug}.mdx`);
      const mod = await evaluate(await readFile(file, "utf8"), runtime);
      return { slug, metadata: mod.metadata as Meta };
    }),
  );
}

const videos = toVideos(await loadEntries<VideoMeta>("video"));
const pillole = toPillole(await loadEntries<PillolaMeta>("pillole"));
const sitemapXml = resolveSitemap(buildSitemap(videos, pillole));

/** JSON-LD come lo scrive la pagina /video/<slug>: videoObjectJsonLd → <JsonLd> (serializeJsonLd). */
const pageJsonLd = (video: (typeof videos)[number]) =>
  JSON.parse(serializeJsonLd(videoObjectJsonLd(video))) as {
    uploadDate: string;
  };

const lastmodOf = (pagePath: string) => {
  const loc = `<loc>${new URL(pagePath, site.url).toString()}</loc>`;
  const after = sitemapXml.slice(sitemapXml.indexOf(loc));
  assert.ok(sitemapXml.includes(loc), `${pagePath} manca nella sitemap`);
  return /<lastmod>([^<]+)<\/lastmod>/.exec(
    after.slice(0, after.indexOf("</url>")),
  )?.[1];
};

const romeDay = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(
    new Date(iso),
  );

// Le due pagine segnalate da Search Console il 20/11/2026: prima avevano solo il giorno.
// L'orario è quello reale di pubblicazione su YouTube.
for (const [slug, uploadDate, day, shown] of [
  ["claude-design", "2026-11-12T08:00:31Z", "2026-11-12", "12 novembre 2026"],
  [
    "cosa-e-una-skill",
    "2026-11-17T08:35:12Z",
    "2026-11-17",
    "17 novembre 2026",
  ],
] as const) {
  test(`/video/${slug}: contenuto → JSON-LD → sitemap con data, ora e fuso`, () => {
    const video = videos.find((v) => v.slug === slug);
    assert.ok(video, `${slug} non caricato`);
    const jsonLd = pageJsonLd(video);
    assert.equal(jsonLd.uploadDate, uploadDate);
    assert.match(jsonLd.uploadDate, isoDateTimeFormat);
    assert.equal(romeDay(jsonLd.uploadDate), day);
    assert.equal(formatDate(video.date), shown); // la data mostrata in pagina resta quella
    assert.equal(lastmodOf(`/video/${slug}`), uploadDate);
  });
}

test("ogni video e ogni puntata del lunedì arriva a JSON-LD e sitemap con un datetime valido", () => {
  assert.ok(videos.length >= 5 && pillole.length >= 3);
  for (const video of videos) {
    const { uploadDate } = pageJsonLd(video);
    assert.doesNotThrow(() => parseIsoDateTime(uploadDate, video.slug));
    assert.equal(lastmodOf(`/video/${video.slug}`), uploadDate);
  }
  for (const pillola of pillole) {
    assert.equal(lastmodOf(`${site.mondayPath}/${pillola.slug}`), pillola.date);
  }
});

test("le liste sono dalla più recente, e le puntate attuali restano nello stesso ordine", () => {
  for (const list of [videos, pillole]) {
    for (let i = 1; i < list.length; i++) {
      assert.ok(
        toEpoch(list[i - 1].date) >= toEpoch(list[i].date),
        list[i].slug,
      );
    }
  }
  // Solo l'ordine relativo delle puntate di oggi: una puntata nuova, ovunque cada, non rompe il test.
  const today = [
    "cosa-e-una-skill",
    "claude-design",
    "grok-bot",
    "report-meta-ads-claude",
    "progetti-claude",
  ];
  assert.deepEqual(
    videos.map((v) => v.slug).filter((s) => today.includes(s)),
    today,
  );
});

test("l'ordine è per istante, non per stringa", () => {
  // Alfabeticamente "…T09:00:31+01:00" viene dopo "…T08:30:00Z", ma è un istante precedente (08:00:31Z).
  const entries = [
    { slug: "prima", metadata: { date: "2026-11-12T09:00:31+01:00" } },
    { slug: "dopo", metadata: { date: "2026-11-12T08:30:00Z" } },
  ] as ContentEntry<VideoMeta>[];
  assert.deepEqual(
    toVideos(entries).map((v) => v.slug),
    ["dopo", "prima"],
  );
  const shuffled = [...videos].reverse();
  assert.deepEqual(sortByDateDesc(shuffled), videos);
});
