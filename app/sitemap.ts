import type { MetadataRoute } from "next";
import { getPillole, getVideos } from "@/lib/content";
import { buildSitemap } from "@/lib/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [videos, pillole] = await Promise.all([getVideos(), getPillole()]);
  return buildSitemap(videos, pillole);
}
