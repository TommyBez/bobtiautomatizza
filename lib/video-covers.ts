import type { StaticImageData } from "next/image";
import cosaEUnaSkill from "@/content/video/covers/cosa-e-una-skill.webp";

/**
 * Copertine ufficiali dei video, per slug. Prendono il posto della miniatura di YouTube;
 * i video senza copertina qui continuano a usare quella.
 */
const videoCovers: Record<string, StaticImageData> = {
  "cosa-e-una-skill": cosaEUnaSkill,
};

export function getVideoCover(slug: string): StaticImageData | undefined {
  return Object.hasOwn(videoCovers, slug) ? videoCovers[slug] : undefined;
}
