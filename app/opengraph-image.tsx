import { ogContentType, ogImage, ogSize } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `${site.name}: ${site.headline}`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    eyebrow: "Video brevi e pratici sull'AI",
    title: site.headline,
    subtitle: "Anche se non scrivi codice.",
  });
}
