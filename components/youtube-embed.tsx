"use client";

import { PlayIcon } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import { useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Il video si carica solo al clic, dal dominio youtube-nocookie: niente cookie di YouTube prima dell'interazione.
// Senza `id` (video non ancora uscito su YouTube) si vede solo la copertina, senza pulsante play.
export function YouTubeEmbed({
  id,
  title,
  format,
  cover,
}: {
  id: string;
  title: string;
  format: "short" | "long";
  /** Copertina ufficiale: se c'è, sostituisce la miniatura di YouTube. */
  cover?: StaticImageData;
}) {
  const [playing, setPlaying] = useState(false);
  const ratio = format === "short" ? 9 / 16 : 16 / 9;
  const sizes = "(min-width: 1024px) 360px, 100vw";

  return (
    <AspectRatio
      ratio={ratio}
      className="overflow-hidden rounded-2xl bg-foreground"
    >
      {!id ? (
        cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            loading="eager"
            fetchPriority="high"
            placeholder="blur"
            sizes={sizes}
            className="object-cover"
          />
        ) : null
      ) : playing ? (
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
            src={
              cover ??
              `https://i.ytimg.com/vi/${id}/${format === "short" ? "oar2" : "hqdefault"}.jpg`
            }
            alt=""
            fill
            loading="eager"
            fetchPriority="high"
            placeholder={cover ? "blur" : undefined}
            sizes={sizes}
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
