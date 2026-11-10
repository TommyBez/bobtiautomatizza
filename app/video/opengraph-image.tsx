import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `Tutti i video di ${site.name}`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    eyebrow: "Video",
    title: "Tutti i video di Bob",
    subtitle:
      "Come usare l'AI per toglierti di dosso il lavoro ripetitivo, anche senza scrivere codice.",
  });
}
