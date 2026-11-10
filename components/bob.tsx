import Image from "next/image";

// Bob vettoriale con sfondo trasparente (public/bob.svg, 572×1024).
const RATIO = 572 / 1024;

type BobProps = {
  /** Altezza indicativa in px (arrotondata per mantenere esatte le proporzioni). */
  size: number;
  className?: string;
  /** Immagine principale sopra la piega: caricamento immediato e priorità alta. */
  eager?: boolean;
  alt?: string;
};

export function Bob({ size, className, eager, alt = "" }: BobProps) {
  // L'altezza si ricava dalla larghezza arrotondata: altrimenti il browser la ricalcola
  // e non coincide più con quella dichiarata.
  const width = Math.round(size * RATIO);
  const height = Math.round(width / RATIO);
  return (
    <Image
      src="/bob.svg"
      alt={alt}
      width={width}
      height={height}
      loading={eager ? "eager" : undefined}
      fetchPriority={eager ? "high" : undefined}
      className={className}
    />
  );
}
