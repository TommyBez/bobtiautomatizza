import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `${site.monday}: le novità AI della settimana`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    eyebrow: "Ogni lunedì",
    title: site.monday,
    subtitle:
      "Le novità AI della settimana che possono cambiarti il lavoro, in un video breve.",
  });
}
