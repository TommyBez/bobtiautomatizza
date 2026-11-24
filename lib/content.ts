import "server-only";
import { cacheLife } from "next/cache";
import {
  type Pillola,
  type PillolaMeta,
  slugsIn,
  toPillole,
  toVideos,
  type Video,
  type VideoMeta,
} from "./content-core.ts";

export type {
  Pillola,
  PillolaMeta,
  Video,
  VideoMeta,
} from "./content-core.ts";

// L'import degli MDX resta qui perché lo risolve il bundler; validazione e ordine stanno in content-core.ts.

export async function getVideos(): Promise<Video[]> {
  "use cache";
  cacheLife("max");
  const slugs = await slugsIn("video");
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const { metadata } = (await import(`@/content/video/${slug}.mdx`)) as {
        metadata: VideoMeta;
      };
      return { slug, metadata };
    }),
  );
  return toVideos(entries);
}

export async function getPillole(): Promise<Pillola[]> {
  "use cache";
  cacheLife("max");
  const slugs = await slugsIn("pillole");
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const { metadata } = (await import(`@/content/pillole/${slug}.mdx`)) as {
        metadata: PillolaMeta;
      };
      return { slug, metadata };
    }),
  );
  return toPillole(entries);
}
