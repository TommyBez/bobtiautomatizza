import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `Chi c'è dietro ${site.name}`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    eyebrow: "Chi sono",
    title: "Chi c'è dietro Bob",
    subtitle:
      "Sono Tommaso, sviluppatore dal 2017. Con Bob ti racconto cosa ho imparato lavorando con l'AI.",
  });
}
