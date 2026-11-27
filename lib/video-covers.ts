import type { StaticImageData } from "next/image";
import cosaEUnaSkill from "@/content/video/covers/cosa-e-una-skill.webp";
import firecrawl from "@/content/video/covers/firecrawl.webp";
import gitEGithub from "@/content/video/covers/git-e-github.webp";
import systemOneModels from "@/content/video/covers/system-one-models.webp";

/**
 * Copertine ufficiali dei video, per slug. Prendono il posto della miniatura di YouTube;
 * i video senza copertina qui continuano a usare quella.
 */
const videoCovers: Record<string, StaticImageData> = {
  "cosa-e-una-skill": cosaEUnaSkill,
  firecrawl,
  "git-e-github": gitEGithub,
  "system-one-models": systemOneModels,
};

export function getVideoCover(slug: string): StaticImageData | undefined {
  return Object.hasOwn(videoCovers, slug) ? videoCovers[slug] : undefined;
}
