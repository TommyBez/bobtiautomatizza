import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

// Template condiviso per le immagini Open Graph (file `opengraph-image.tsx` delle route).
// next/og supporta solo flexbox e un sottoinsieme di CSS: niente grid, niente variabili CSS,
// e ogni div con più figli deve avere `display: "flex"`.

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

// Gli stessi colori di app/globals.css (next/og non legge le variabili CSS).
const color = {
  background: "#f6f0e1",
  foreground: "#22261b",
  muted: "#5c6152",
  primary: "#4f5d22",
  sand: "#ece4cf",
  oliveLight: "#c9d48f",
  jeansLight: "#bfe0f5",
};

// Font e Bob non dipendono dalla richiesta: si leggono una volta sola, a livello di modulo.
// next/og accetta solo ttf, otf e woff (non woff2), per questo i font stanno in assets/fonts.
// I percorsi sono scritti per intero perché il tracing di Next includa solo questi file nel deploy.
const [bricolageBold, geistRegular, geistSemiBold, geistMonoMedium, bobSvg] =
  await Promise.all([
    readFile(
      path.join(process.cwd(), "assets/fonts/BricolageGrotesque-Bold.ttf"),
    ),
    readFile(path.join(process.cwd(), "assets/fonts/Geist-Regular.ttf")),
    readFile(path.join(process.cwd(), "assets/fonts/Geist-SemiBold.ttf")),
    readFile(path.join(process.cwd(), "assets/fonts/GeistMono-Medium.ttf")),
    readFile(path.join(process.cwd(), "public/bob.svg")),
  ]);

const bobSrc = `data:image/svg+xml;base64,${bobSvg.toString("base64")}`;
// public/bob.svg è 572×1024.
const BOB_HEIGHT = 660;
const BOB_WIDTH = Math.round((BOB_HEIGHT * 572) / 1024);

type OgImageProps = {
  /** Riga piccola sopra il titolo, es. "Video · 9 novembre 2026". */
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Elenco numerato sotto il titolo (es. le notizie di una pillola). */
  items?: string[];
  /** Etichette sotto il titolo (es. gli strumenti usati in un video). */
  tags?: string[];
};

// Più è lungo il titolo, più si rimpicciolisce, così sta sempre in 3 righe.
function titleSize(title: string) {
  if (title.length <= 30) return 76;
  if (title.length <= 55) return 64;
  return 54;
}

export function ogImage({
  eyebrow,
  title,
  subtitle,
  items,
  tags,
}: OgImageProps) {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: color.background,
        color: color.foreground,
        fontFamily: "Geist",
      }}
    >
      {/* Cerchio azzurro jeans dietro Bob, come nella hero del sito */}
      <div
        style={{
          position: "absolute",
          right: -70,
          bottom: -170,
          width: 560,
          height: 560,
          borderRadius: 9999,
          backgroundColor: color.jeansLight,
        }}
      />
      {/* biome-ignore lint/performance/noImgElement: next/og renderizza JSX in PNG, next/image qui non esiste */}
      <img
        src={bobSrc}
        alt=""
        width={BOB_WIDTH}
        height={BOB_HEIGHT}
        style={{ position: "absolute", right: 40, bottom: -110 }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 790,
          height: "100%",
          padding: "60px 24px 56px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 9999,
              backgroundColor: color.primary,
            }}
          />
          <div style={{ fontFamily: "Bricolage Grotesque", fontSize: 30 }}>
            {site.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: "Geist Mono",
              fontSize: 22,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: color.primary,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              marginTop: 16,
              fontFamily: "Bricolage Grotesque",
              fontSize: titleSize(title),
              lineHeight: 1.05,
              letterSpacing: -1,
              textWrap: "balance",
            }}
          >
            {title}
          </div>

          {subtitle ? (
            <div
              style={{
                display: "block",
                marginTop: 22,
                fontSize: 28,
                lineHeight: 1.35,
                color: color.muted,
                lineClamp: 2,
              }}
            >
              {subtitle}
            </div>
          ) : null}

          {items?.length ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 26,
              }}
            >
              {items.slice(0, 3).map((item, i) => (
                <div
                  key={item}
                  style={{ display: "flex", gap: 8, fontSize: 26 }}
                >
                  <div
                    style={{ width: 30, fontWeight: 600, color: color.primary }}
                  >
                    {`${i + 1}.`}
                  </div>
                  <div
                    style={{
                      display: "block",
                      flex: 1,
                      lineClamp: 1,
                      color: color.muted,
                    }}
                  >
                    {item}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {tags?.length ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 28,
              }}
            >
              {tags.map((tag, i) => (
                <div
                  key={tag}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 9999,
                    fontSize: 22,
                    fontWeight: 600,
                    backgroundColor: i === 0 ? color.oliveLight : color.sand,
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div
          style={{ fontFamily: "Geist Mono", fontSize: 20, color: color.muted }}
        >
          {new URL(site.url).host}
        </div>
      </div>
    </div>,
    {
      ...ogSize,
      fonts: [
        {
          name: "Bricolage Grotesque",
          data: bricolageBold,
          weight: 700,
          style: "normal",
        },
        { name: "Geist", data: geistRegular, weight: 400, style: "normal" },
        { name: "Geist", data: geistSemiBold, weight: 600, style: "normal" },
        {
          name: "Geist Mono",
          data: geistMonoMedium,
          weight: 500,
          style: "normal",
        },
      ],
    },
  );
}
