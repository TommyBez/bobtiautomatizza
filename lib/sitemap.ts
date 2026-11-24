// Senza import di Next a runtime: lo usa app/sitemap.ts e lo esegue anche `node --test` (vedi content.test.ts).
import type { MetadataRoute } from "next";
import type { Pillola, Video } from "./content-core.ts";
import { site } from "./site.ts";

/**
 * Voci della sitemap. `lastModified` dei contenuti è la loro `date`, già validata al caricamento.
 * Un video in attesa di YouTube (solo in preview) non ha data: la voce c'è, senza `lastModified`.
 */
export function buildSitemap(
  videos: Video[],
  pillole: Pillola[],
): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, site.url).toString();

  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/video"), changeFrequency: "weekly", priority: 0.9 },
    { url: url(site.mondayPath), changeFrequency: "weekly", priority: 0.7 },
    { url: url("/metodo"), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/chi-sono"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/newsletter"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/cookie"), changeFrequency: "yearly", priority: 0.2 },
    ...videos.map((v) => ({
      url: url(`/video/${v.slug}`),
      ...(v.date ? { lastModified: v.date } : {}),
      priority: 0.8,
    })),
    ...pillole.map((p) => ({
      url: url(`${site.mondayPath}/${p.slug}`),
      lastModified: p.date,
      priority: 0.5,
    })),
  ];
}
