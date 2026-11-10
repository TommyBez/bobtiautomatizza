import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `La newsletter di ${site.name}`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    eyebrow: "Newsletter",
    title: "Ogni lunedì nella tua email",
    subtitle: "Le novità AI della settimana e i video usciti nei giorni prima.",
  });
}
