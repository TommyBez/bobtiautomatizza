import type { MetadataRoute } from "next";
import { getPillole, getVideos } from "@/lib/content";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [videos, pillole] = await Promise.all([getVideos(), getPillole()]);
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
      lastModified: v.date,
      priority: 0.8,
    })),
    ...pillole.map((p) => ({
      url: url(`${site.mondayPath}/${p.slug}`),
      lastModified: p.date,
      priority: 0.5,
    })),
  ];
}
