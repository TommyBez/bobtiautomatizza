import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { metodo } from "@/lib/site";

export const alt =
  "Il metodo di Bob: capisci il processo, ripuliscilo, mettici l'AI";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    eyebrow: "Il metodo",
    title: "Prima il processo, poi l'AI",
    items: metodo.map((m) => m.title),
  });
}
