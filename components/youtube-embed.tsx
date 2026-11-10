"use client";

import { PlayIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Il video si carica solo al clic, dal dominio youtube-nocookie: niente cookie di YouTube prima dell'interazione.
export function YouTubeEmbed({
  id,
  title,
  format,
}: {
  id: string;
  title: string;
  format: "short" | "long";
}) {
  const [playing, setPlaying] = useState(false);
  const ratio = format === "short" ? 9 / 16 : 16 / 9;

  return (
    <AspectRatio
      ratio={ratio}
      className="overflow-hidden rounded-2xl bg-foreground"
    >
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 size-full"
          aria-label={`Guarda il video: ${title}`}
        >
          <Image
            src={`https://i.ytimg.com/vi/${id}/${format === "short" ? "oar2" : "hqdefault"}.jpg`}
            alt=""
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 360px, 100vw"
            className="object-cover opacity-90"
          />
          <span className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-background text-primary shadow-lg transition group-hover:scale-105">
            <PlayIcon className="size-7 fill-current" />
          </span>
        </button>
      )}
    </AspectRatio>
  );
}
