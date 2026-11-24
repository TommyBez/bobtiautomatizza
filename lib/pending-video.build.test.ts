// Prova sul build vero, finché in content/video c'è un video IN_ATTESA_DI_YOUTUBE: senza, il test è saltato.
// Lancia `next build` e `next start` (circa un minuto) e lascia in .next il build di preview.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { request } from "node:http";
import path from "node:path";
import { test } from "node:test";
import { slugsIn } from "./content-core.ts";
import { IN_ATTESA_DI_YOUTUBE } from "./pending-videos.ts";
import { site } from "./site.ts";

const root = process.cwd();
const nextBin = path.join(root, "node_modules", ".bin", "next");
const mdx = (slug: string) =>
  readFileSync(path.join(root, "content", "video", `${slug}.mdx`), "utf8");
const pending = (await slugsIn("video")).filter((slug) =>
  mdx(slug).includes(`"${IN_ATTESA_DI_YOUTUBE}"`),
);
const published = (await slugsIn("video")).filter((s) => !pending.includes(s));

type Env = Record<string, string>;

/** Ambiente del processo senza le variabili che decidono la modalità, più quelle indicate. */
function envWith(extra: Env) {
  const env = { ...process.env };
  for (const key of [
    "VERCEL_ENV",
    "VERCEL_TARGET_ENV",
    "NODE_ENV",
    "NODE_TEST_CONTEXT",
  ]) {
    delete env[key];
  }
  return { ...env, ...extra };
}

function build(extra: Env) {
  const result = spawnSync(nextBin, ["build"], {
    cwd: root,
    env: envWith(extra),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { status: result.status, output: result.stdout + result.stderr };
}

const built = (file: string) =>
  readFileSync(path.join(root, ".next", "server", "app", file), "utf8");

type Reply = { status: number; body: string };

/** GET con un header Host a scelta (fetch lo ignora): serve a simulare il dominio di produzione. */
const getFrom =
  (port: number) =>
  (p: string, host?: string): Promise<Reply> =>
    new Promise((resolve, reject) => {
      const req = request(
        { host: "127.0.0.1", port, path: p, headers: host ? { host } : {} },
        (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
        },
      );
      req.on("error", reject);
      req.end();
    });

/** Avvia `next start` sul build in .next, esegue `check` e ferma il server. */
async function withServer(
  extra: Env,
  check: (get: ReturnType<typeof getFrom>) => Promise<void>,
) {
  const port = 4300 + (process.pid % 500);
  const server = spawn(nextBin, ["start", "-p", String(port)], {
    cwd: root,
    env: envWith(extra),
    stdio: "ignore",
  });
  const get = getFrom(port);
  try {
    for (let i = 0; ; i++) {
      try {
        await get("/robots.txt");
        break;
      } catch (error) {
        if (i > 120) throw error;
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    await check(get);
  } finally {
    server.kill();
  }
}

const notInPreview: Env[] = [
  { VERCEL_ENV: "production" },
  { VERCEL_ENV: "preview", VERCEL_TARGET_ENV: "production" },
  {}, // next build / next start senza variabili
];

test(
  "video in attesa: niente build né server di produzione, preview senza dati inventati",
  {
    skip: pending.length === 0 ? "nessun video IN_ATTESA_DI_YOUTUBE" : false,
    timeout: 15 * 60_000,
  },
  async (t) => {
    await t.test("il build fuori dalla preview si ferma", () => {
      for (const env of notInPreview) {
        const { status, output } = build(env);
        assert.notEqual(status, 0, JSON.stringify(env));
        for (const slug of pending) {
          assert.match(
            output,
            new RegExp(
              `content/video/${slug}\\.mdx: .*ancora "${IN_ATTESA_DI_YOUTUBE}"`,
            ),
            JSON.stringify(env),
          );
        }
      }
    });

    await t.test("il build di preview riesce", () => {
      const { status, output } = build({ VERCEL_ENV: "preview" });
      assert.equal(status, 0, output.slice(-3000));
    });

    await t.test("HTML e sitemap della preview", () => {
      const sitemap = built("sitemap.xml.body");
      const home = built("index.html");
      for (const slug of pending) {
        const href = `href="/video/${slug}"`;
        const html = built(`video/${slug}.html`);
        assert.doesNotMatch(html, /VideoObject|<iframe|<time|IN_ATTESA/);
        if (existsSync(path.join(root, "content/video/covers", `${slug}.webp`)))
          assert.match(html, new RegExp(`%2F${slug}\\.[^"&]*\\.webp`));
        // In sitemap la voce c'è, senza <lastmod>.
        const loc = `<loc>${new URL(`/video/${slug}`, site.url)}</loc>`;
        assert.ok(sitemap.includes(`${loc}\n<priority>`), slug);
        // Compare solo in /video e negli «Ultimi video» della home (non nell'anteprima email).
        assert.ok(built("video.html").includes(href), slug);
        assert.equal(home.split(href).length - 1, 1, slug);
        for (const page of [
          "metodo.html",
          "newsletter.html",
          ...published.map((s) => `video/${s}.html`),
        ]) {
          assert.ok(!built(page).includes(href), `${page} → ${slug}`);
        }
      }
      assert.ok(!sitemap.includes(IN_ATTESA_DI_YOUTUBE));
    });

    await t.test(
      "il build di preview non si serve in produzione (next start)",
      async () => {
        for (const env of notInPreview) {
          await withServer(env, async (get) => {
            for (const p of ["/", "/video", `/video/${pending[0]}`]) {
              const res = await get(p);
              assert.equal(res.status, 500, `${JSON.stringify(env)} ${p}`);
              assert.ok(!res.body.includes(`/video/${pending[0]}`));
            }
          });
        }
      },
    );

    await t.test(
      "in preview si serve, ma non sul dominio di produzione",
      async () => {
        const host = new URL(site.url).hostname;
        await withServer({ VERCEL_ENV: "preview" }, async (get) => {
          assert.equal((await get(`/video/${pending[0]}`)).status, 200);
          for (const h of [host, `www.${host}`]) {
            for (const p of ["/", `/video/${pending[0]}`, "/sitemap.xml"]) {
              assert.equal((await get(p, h)).status, 404, `${h}${p}`);
            }
          }
        });
      },
    );
  },
);
