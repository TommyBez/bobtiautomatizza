import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { IN_ATTESA_DI_YOUTUBE } from "./lib/pending-videos.ts";
import { site } from "./lib/site.ts";

// Video con il segnaposto IN_ATTESA_DI_YOUTUBE in qualsiasi punto del file (vedi lib/pending-videos.ts).
// Il caricamento dei contenuti ferma il build fuori dalla preview; qui si marca il build che li contiene,
// perché il suo risultato non vada in produzione nemmeno riusandolo senza ricostruirlo.
const videoDir = path.join(process.cwd(), "content", "video");
const filesInAttesa = readdirSync(videoDir)
  .filter((f) => f.endsWith(".mdx"))
  .filter((f) =>
    readFileSync(path.join(videoDir, f), "utf8").includes(IN_ATTESA_DI_YOUTUBE),
  )
  .map((f) => `content/video/${f}`);

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // Fissato nel build: instrumentation.ts non fa partire un server di produzione costruito così.
  env: { BOB_VIDEO_IN_ATTESA: filesInAttesa.join(",") },
  // Se un build così finisse comunque sul dominio di produzione (es. promozione senza ricostruire),
  // ogni richiesta lì risponde 404. Nei build senza video in attesa non c'è nessuna regola.
  async rewrites() {
    if (filesInAttesa.length === 0) return [];
    const host = new URL(site.url).hostname.replaceAll(".", "\\.");
    return {
      beforeFiles: [
        {
          source: "/:path*",
          has: [{ type: "host", value: `(?:www\\.)?${host}` }],
          destination: "/video-in-attesa-di-youtube",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
