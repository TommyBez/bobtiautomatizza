import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { pathToFileURL } from "node:url";
import { evaluate } from "@mdx-js/mdx";
import type { MetadataRoute } from "next";
import * as runtime from "react/jsx-runtime";
import {
  type ContentEntry,
  IN_ATTESA_DI_YOUTUBE,
  isPublished,
  type PillolaMeta,
  type PublishedVideo,
  pendingVideosAllowed,
  slugsIn,
  sortByDateDesc,
  toPillole,
  toVideos,
  type VideoMeta,
} from "./content-core.ts";
import {
  type IsoDateTime,
  isoDateTimeFormat,
  parseIsoDateTime,
  toEpoch,
} from "./datetime.ts";
import { serializeJsonLd, videoObjectJsonLd } from "./json-ld.ts";
import { formatDate, site } from "./site.ts";
import { buildSitemap } from "./sitemap.ts";

type EstreeNode = { type: string; [key: string]: unknown };
type MdastNode = {
  type: string;
  children?: MdastNode[];
  data?: { estree?: { body: EstreeNode[] } };
};

/**
 * Plugin remark: sostituisce gli `import` degli MDX con segnaposto `const x = undefined`.
 * Agli MDX il sito permette di importare componenti, immagini e moduli con l'alias `@/`, che risolve il
 * bundler e che Node da solo non sa caricare. Ai metadati non servono: così il test regge ogni MDX che
 * il sito accetta. Conseguenza voluta: `metadata` deve essere un oggetto scritto nel file, non un valore
 * importato (altrimenti qui risulta `undefined` e il test fallisce indicando il campo).
 */
function stubImports() {
  const visit = (node: MdastNode) => {
    const body = node.type === "mdxjsEsm" ? node.data?.estree?.body : undefined;
    body?.forEach((statement, i) => {
      if (statement.type !== "ImportDeclaration") return;
      const specifiers = statement.specifiers as { local: { name: string } }[];
      body[i] =
        specifiers.length === 0
          ? { type: "EmptyStatement" }
          : {
              type: "VariableDeclaration",
              kind: "const",
              declarations: specifiers.map(({ local }) => ({
                type: "VariableDeclarator",
                id: { type: "Identifier", name: local.name },
                init: { type: "Identifier", name: "undefined" },
              })),
            };
    });
    node.children?.forEach(visit);
  };
  return visit;
}

/** `export const metadata` di un MDX, compilato con @mdx-js/mdx: lo stesso compilatore che usa @next/mdx. */
async function readMdxMetadata(file: string): Promise<unknown> {
  const mod = await evaluate(await readFile(file, "utf8"), {
    ...runtime,
    baseUrl: pathToFileURL(file), // import.meta.url e URL relativi come nel file vero
    remarkPlugins: [stubImports],
  });
  return mod.metadata;
}

/** Legge `content/<folder>` come fa lib/content.ts: stessi slug (slugsIn), stesso compilatore MDX. */
async function loadEntries<Meta>(folder: "video" | "pillole") {
  const slugs = await slugsIn(folder);
  return Promise.all(
    slugs.map(
      async (slug): Promise<ContentEntry<Meta>> => ({
        slug,
        metadata: (await readMdxMetadata(
          path.join(process.cwd(), "content", folder, `${slug}.mdx`),
        )) as Meta,
      }),
    ),
  );
}

// Contenuti caricati come in preview: un video ancora IN_ATTESA_DI_YOUTUBE c'è, senza ID e senza data.
// Che il build di produzione si fermi lo verifica il test sul segnaposto, in fondo.
const videos = toVideos(await loadEntries<VideoMeta>("video"), {
  allowPending: true,
});
const pillole = toPillole(await loadEntries<PillolaMeta>("pillole"));
/** Quello che restituisce app/sitemap.ts e che Next scrive in sitemap.xml. */
const sitemap = buildSitemap(videos, pillole);

/**
 * Il serializzatore con cui Next scrive sitemap.xml. Non è un'API pubblica: Next è fissato a una versione
 * esatta in package.json, e se un aggiornamento sposta questo modulo il test dell'XML viene saltato con un
 * avviso (gli altri controlli sulla sitemap restano). Basta aggiornare il percorso qui.
 */
const NEXT_SITEMAP_MODULE =
  "next/dist/build/webpack/loaders/metadata/resolve-route-data.js";
const resolveSitemap = (() => {
  try {
    const mod = createRequire(import.meta.url)(NEXT_SITEMAP_MODULE) as {
      resolveSitemap?: (data: MetadataRoute.Sitemap) => string;
    };
    return typeof mod.resolveSitemap === "function"
      ? mod.resolveSitemap
      : undefined;
  } catch {
    return undefined;
  }
})();

/** JSON-LD come lo scrive la pagina /video/<slug>: videoObjectJsonLd → <JsonLd> (serializeJsonLd). */
const pageJsonLd = (video: PublishedVideo) =>
  JSON.parse(serializeJsonLd(videoObjectJsonLd(video))) as {
    uploadDate: string;
  };

const lastModifiedOf = (pagePath: string) => {
  const url = new URL(pagePath, site.url).toString();
  const entry = sitemap.find((e) => e.url === url);
  assert.ok(entry, `${pagePath} manca nella sitemap`);
  return entry.lastModified;
};

const romeDay = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(
    new Date(iso),
  );

// Le due pagine segnalate da Search Console il 20/11/2026: prima avevano solo il giorno.
// L'orario è quello reale di pubblicazione su YouTube.
const reported = [
  ["claude-design", "2026-11-12T08:00:31Z", "2026-11-12", "12 novembre 2026"],
  [
    "cosa-e-una-skill",
    "2026-11-17T08:35:12Z",
    "2026-11-17",
    "17 novembre 2026",
  ],
] as const;

for (const [slug, uploadDate, day, shown] of reported) {
  test(`/video/${slug}: contenuto → JSON-LD → sitemap con data, ora e fuso`, () => {
    const video = videos.find((v) => v.slug === slug);
    assert.ok(video && isPublished(video), `${slug} non caricato`);
    const jsonLd = pageJsonLd(video);
    assert.equal(jsonLd.uploadDate, uploadDate);
    assert.match(jsonLd.uploadDate, isoDateTimeFormat);
    assert.equal(romeDay(jsonLd.uploadDate), day);
    assert.equal(formatDate(video.date), shown); // la data mostrata in pagina resta quella
    assert.equal(lastModifiedOf(`/video/${slug}`), uploadDate);
  });
}

// Orari reali di pubblicazione su YouTube: non vanno arrotondati (la pillola del 16/11 era scritta 08:00:00Z).
const youtubeUploads = [
  ["/video/git-e-github", "2026-11-19T08:00:33Z", "19 novembre 2026"],
  [`${site.mondayPath}/2026-11-23`, "2026-11-23T08:00:03Z", "23 novembre 2026"],
  [`${site.mondayPath}/2026-11-16`, "2026-11-16T08:00:09Z", "16 novembre 2026"],
] as const;

for (const [pagePath, uploadDate, shown] of youtubeUploads) {
  test(`${pagePath}: data e ora di YouTube in pagina e in sitemap`, () => {
    const slug = pagePath.split("/").at(-1);
    const video = videos.find((v) => `/video/${v.slug}` === pagePath);
    const item = video ?? pillole.find((p) => p.slug === slug);
    assert.ok(item?.date, `${pagePath} non caricato`);
    assert.equal(item.date, uploadDate);
    assert.equal(formatDate(item.date), shown);
    assert.equal(lastModifiedOf(pagePath), uploadDate);
    if (video) {
      assert.ok(isPublished(video), pagePath);
      assert.equal(pageJsonLd(video).uploadDate, uploadDate);
    }
  });
}

test("ogni video e ogni puntata del lunedì arriva a JSON-LD e sitemap con un datetime valido", () => {
  assert.ok(videos.length >= 5 && pillole.length >= 3);
  for (const video of videos) {
    if (!isPublished(video)) {
      // In attesa di YouTube (solo in preview): la pagina è in sitemap, ma senza una data inventata.
      assert.equal(lastModifiedOf(`/video/${video.slug}`), undefined);
      continue;
    }
    const { uploadDate } = pageJsonLd(video);
    assert.doesNotThrow(() => parseIsoDateTime(uploadDate, video.slug));
    assert.ok(!Number.isNaN(toEpoch(video.date)), video.slug);
    assert.equal(lastModifiedOf(`/video/${video.slug}`), uploadDate);
  }
  for (const pillola of pillole) {
    assert.ok(!Number.isNaN(toEpoch(pillola.date)), pillola.slug);
    assert.equal(
      lastModifiedOf(`${site.mondayPath}/${pillola.slug}`),
      pillola.date,
    );
  }
});

test(
  "sitemap.xml come la scrive Next: <lastmod> uguale a uploadDate",
  {
    skip: resolveSitemap
      ? false
      : `${NEXT_SITEMAP_MODULE} non trovato: aggiornare il percorso`,
  },
  () => {
    const xml = resolveSitemap?.(sitemap) ?? "";
    const pages = [
      ...reported.map(([slug, uploadDate]) => [`/video/${slug}`, uploadDate]),
      ...youtubeUploads,
    ];
    for (const [pagePath, uploadDate] of pages) {
      const loc = `<loc>${new URL(pagePath, site.url)}</loc>`;
      assert.ok(
        xml.includes(`${loc}\n<lastmod>${uploadDate}</lastmod>`),
        pagePath,
      );
    }
  },
);

/** Istante per l'ordine: un video senza data (in attesa di YouTube) viene dopo tutti, quindi in testa. */
const epochOf = (date: IsoDateTime | null) =>
  date === null ? Number.POSITIVE_INFINITY : toEpoch(date);

test("le liste sono dalla più recente, e le puntate attuali restano nello stesso ordine", () => {
  for (const list of [videos, pillole]) {
    for (let i = 1; i < list.length; i++) {
      assert.ok(
        epochOf(list[i - 1].date) >= epochOf(list[i].date),
        list[i].slug,
      );
    }
  }
  // Solo l'ordine relativo delle puntate di oggi: una puntata nuova, ovunque cada, non rompe il test.
  const today = [
    "git-e-github",
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
  const lunedi = ["2026-11-23", "2026-11-16", "2026-11-09", "2026-11-07"];
  assert.deepEqual(
    pillole.map((p) => p.slug).filter((s) => lunedi.includes(s)),
    lunedi,
  );
});

test("l'ordine è per istante, non per stringa, e regge le parità", () => {
  // Alfabeticamente "…T09:00:31+01:00" viene dopo "…T08:30:00Z", ma è un istante precedente (08:00:31Z).
  const entries = [
    { slug: "prima", metadata: { date: "2026-11-12T09:00:31+01:00" } },
    { slug: "dopo", metadata: { date: "2026-11-12T08:30:00Z" } },
    // Stesso istante di "prima", scritto in UTC: a parità vale qualsiasi ordine tra i due.
    { slug: "stesso-istante", metadata: { date: "2026-11-12T08:00:31Z" } },
  ] as ContentEntry<VideoMeta>[];
  const sorted = toVideos(entries).map((v) => v.slug);
  assert.equal(sorted[0], "dopo");
  assert.deepEqual(sorted.slice(1).sort(), ["prima", "stesso-istante"]);

  // Riordinare una lista mescolata dà la stessa sequenza di istanti: si confrontano gli istanti e non
  // gli oggetti, perché a parità d'istante l'ordine tra i due video può cambiare senza essere un errore.
  const epochs = (list: typeof videos) => list.map((v) => epochOf(v.date));
  const withTie = [...videos, { ...videos[0], slug: "copia-stesso-istante" }];
  assert.deepEqual(
    epochs(sortByDateDesc([...videos].reverse())),
    epochs(videos),
  );
  assert.deepEqual(
    epochs(sortByDateDesc([...withTie].reverse())),
    epochs(sortByDateDesc(withTie)),
  );
});

const fixtureDir = await mkdtemp(path.join(tmpdir(), "bob-mdx-"));
after(() => rm(fixtureDir, { recursive: true, force: true }));

test("il caricamento dei metadati regge gli MDX con import (relativi, alias @/, immagini)", async () => {
  await writeFile(path.join(fixtureDir, "helper.ts"), "export const x = 1;\n");
  const file = path.join(fixtureDir, "puntata.mdx");
  await writeFile(
    file,
    [
      'import { x } from "./helper.ts";',
      'import cover from "./covers/puntata.webp";',
      'import { Callout } from "@/components/callout";',
      'import "./stile.css";',
      "",
      "export const metadata = {",
      '  title: "T",',
      '  youtubeTitle: "T",',
      '  youtubeId: "abc",',
      '  format: "short",',
      '  date: "2026-11-20T10:00:00+01:00",',
      '  description: "d",',
      "  inBreve: [],",
      "  topics: [],",
      "  tools: [],",
      "};",
      "",
      "<Callout>Testo con {x} e <img src={cover.src} /></Callout>",
      "",
    ].join("\n"),
  );
  const metadata = (await readMdxMetadata(file)) as VideoMeta;
  const [video] = toVideos([{ slug: "puntata", metadata }]);
  assert.ok(isPublished(video));
  assert.equal(video.date, "2026-11-20T10:00:00+01:00");
  assert.equal(pageJsonLd(video).uploadDate, "2026-11-20T10:00:00+01:00");
});

/** Metadati di un video di prova, con i campi da sostituire. */
const fixtureVideo = (slug: string, fields: Partial<VideoMeta> = {}) => ({
  slug,
  metadata: {
    title: "T",
    youtubeTitle: "T",
    youtubeId: "abc",
    format: "short",
    date: "2026-11-20T10:00:00+01:00",
    description: "d",
    inBreve: [],
    topics: [],
    tools: [],
    ...fields,
  } satisfies VideoMeta,
});

test("segnaposto IN_ATTESA_DI_YOUTUBE: fuori dalla preview il caricamento si ferma e dice cosa manca", () => {
  const entries = [
    fixtureVideo("uscito"),
    fixtureVideo("in-attesa", {
      youtubeId: IN_ATTESA_DI_YOUTUBE,
      date: IN_ATTESA_DI_YOUTUBE,
    }),
  ];
  assert.throws(
    () => toVideos(entries),
    (error: Error) =>
      error.message.startsWith(
        'content/video/in-attesa.mdx: youtubeId e date ancora "IN_ATTESA_DI_YOUTUBE".',
      ) && error.message.includes("prima di andare in produzione"),
  );
  // Anche uno solo dei due dati basta a fermarlo.
  assert.throws(
    () =>
      toVideos([fixtureVideo("senza-data", { date: IN_ATTESA_DI_YOUTUBE })]),
    /senza-data\.mdx: date ancora "IN_ATTESA_DI_YOUTUBE"/,
  );
});

test("segnaposto IN_ATTESA_DI_YOUTUBE: in preview c'è la pagina, senza ID, data, VideoObject né lastmod", () => {
  const loaded = toVideos(
    [
      fixtureVideo("uscito"),
      fixtureVideo("in-attesa", {
        youtubeId: IN_ATTESA_DI_YOUTUBE,
        date: IN_ATTESA_DI_YOUTUBE,
      }),
    ],
    { allowPending: true },
  );
  assert.deepEqual(
    loaded.map((v) => v.slug),
    ["in-attesa", "uscito"], // il video in attesa è il più nuovo: in testa alle liste
  );
  const [pending, published] = loaded;
  assert.equal(pending.youtubeId, null);
  assert.equal(pending.date, null);
  assert.equal(isPublished(pending), false); // la pagina non scrive il VideoObject
  assert.equal(isPublished(published), true);
  const entries = buildSitemap(loaded, []);
  const entry = entries.find((e) => e.url.endsWith("/video/in-attesa"));
  assert.ok(entry);
  assert.equal("lastModified" in entry, false);
  // Con i dati veri al posto del segnaposto, lo stesso file torna un video normale.
  const [done] = toVideos([fixtureVideo("in-attesa")]);
  assert.ok(isPublished(done));
});

test("il segnaposto è ammesso solo in preview su Vercel e in next dev", () => {
  assert.equal(pendingVideosAllowed({ VERCEL_ENV: "preview" }), true);
  assert.equal(pendingVideosAllowed({ NODE_ENV: "development" }), true);
  // next build imposta NODE_ENV=production: fuori dalla preview il build si ferma, anche in locale.
  for (const env of [
    { VERCEL_ENV: "production", NODE_ENV: "production" },
    { NODE_ENV: "production" },
    {},
  ]) {
    assert.equal(pendingVideosAllowed(env), false, JSON.stringify(env));
  }
});
