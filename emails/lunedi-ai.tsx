import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";
import { color, font } from "./theme";

export type LunediAIProps = {
  siteUrl: string;
  /** Data leggibile, es. "9 novembre 2026". */
  date: string;
  /** Settimana coperta, es. "30 ottobre – 6 novembre 2026". */
  period: string;
  title: string;
  /** Due o tre righe di Bob in apertura. */
  intro: string;
  items: { title: string; text?: string; source?: string }[];
  pillolaUrl: string;
  videos: { title: string; url: string }[];
  /** Nei broadcast Resend sostituisce {{{RESEND_UNSUBSCRIBE_URL}}} con il link di disiscrizione. */
  unsubscribeUrl?: string;
};

export function LunediAI({
  siteUrl,
  date,
  period,
  title,
  intro,
  items,
  pillolaUrl,
  videos,
  unsubscribeUrl = "{{{RESEND_UNSUBSCRIBE_URL}}}",
}: LunediAIProps) {
  return (
    <Html lang="it">
      <Head />
      <Preview>{items.map((i) => i.title).join(" · ")}</Preview>
      <Body
        lang="it"
        style={{
          backgroundColor: color.background,
          fontFamily: font,
          margin: 0,
          padding: "32px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: color.paper,
            borderRadius: 16,
            maxWidth: 560,
            padding: "28px 32px",
            border: `1px solid ${color.border}`,
          }}
        >
          <Section>
            <Img
              src={`${siteUrl}/email/bob.png`}
              alt="Bob"
              width={34}
              height={60}
              style={{ display: "inline-block", verticalAlign: "middle" }}
            />
            <Text
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                margin: "0 0 0 12px",
                color: color.muted,
                fontSize: 13,
                lineHeight: "18px",
              }}
            >
              <strong style={{ color: color.ink }}>
                Il lunedì dell&apos;AI
              </strong>
              <br />
              {date} · novità dal {period}
            </Text>
          </Section>

          <Heading
            as="h1"
            style={{
              color: color.ink,
              fontSize: 26,
              lineHeight: "32px",
              margin: "24px 0 8px",
            }}
          >
            {title}
          </Heading>
          <Text
            style={{
              color: color.ink,
              fontSize: 16,
              lineHeight: "26px",
              margin: "0 0 20px",
            }}
          >
            {intro}
          </Text>

          {items.map((item, i) => (
            <Section
              key={item.title}
              style={{
                borderLeft: `4px solid ${color.oliveLight}`,
                padding: "2px 0 2px 16px",
                margin: "0 0 16px",
              }}
            >
              <Text
                style={{
                  color: color.ink,
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: "24px",
                  margin: 0,
                }}
              >
                {i + 1}. {item.title}
              </Text>
              {item.text ? (
                <Text
                  style={{
                    color: color.muted,
                    fontSize: 15,
                    lineHeight: "23px",
                    margin: "2px 0 0",
                  }}
                >
                  {item.text}
                </Text>
              ) : null}
              {item.source ? (
                <Link
                  href={item.source}
                  style={{
                    color: color.olive,
                    fontSize: 14,
                    textDecoration: "underline",
                  }}
                >
                  Fonte
                </Link>
              ) : null}
            </Section>
          ))}

          <Section style={{ margin: "8px 0 24px" }}>
            <Button
              href={pillolaUrl}
              style={{
                backgroundColor: color.olive,
                borderRadius: 12,
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 600,
                padding: "12px 22px",
              }}
            >
              Guarda la pillola
            </Button>
          </Section>

          {videos.length > 0 ? (
            <>
              <Hr style={{ borderColor: color.border, margin: "8px 0 16px" }} />
              <Text
                style={{
                  color: color.muted,
                  fontSize: 12,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  margin: "0 0 8px",
                }}
              >
                I video della settimana
              </Text>
              {videos.map((v) => (
                <Text
                  key={v.url}
                  style={{
                    fontSize: 16,
                    lineHeight: "24px",
                    margin: "0 0 6px",
                  }}
                >
                  <Link
                    href={v.url}
                    style={{ color: color.olive, textDecoration: "underline" }}
                  >
                    {v.title}
                  </Link>
                </Text>
              ))}
            </>
          ) : null}

          <Text
            style={{
              color: color.ink,
              fontSize: 16,
              lineHeight: "24px",
              margin: "24px 0 0",
            }}
          >
            A lunedì prossimo,
          </Text>
          <Text
            style={{
              color: color.ink,
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Bob
          </Text>
        </Container>
        <Text
          style={{
            color: color.muted,
            fontSize: 12,
            lineHeight: "18px",
            textAlign: "center",
            margin: "16px 24px 0",
          }}
        >
          Ricevi questa email perché hai confermato l&apos;iscrizione a Il
          lunedì dell&apos;AI su bobtiautomatizza.com.
          <br />
          <Link
            href={unsubscribeUrl}
            style={{ color: color.muted, textDecoration: "underline" }}
          >
            Cancella l&apos;iscrizione
          </Link>
        </Text>
      </Body>
    </Html>
  );
}

LunediAI.PreviewProps = {
  siteUrl: "https://bobtiautomatizza.com",
  date: "9 novembre 2026",
  period: "30 ottobre – 6 novembre 2026",
  title: "L'AI entra nei tuoi file e nei tuoi moduli",
  intro:
    "Ciao, questa settimana l'AI si avvicina ai documenti che usi tutti i giorni. Ecco le tre novità che vale la pena conoscere.",
  items: [
    {
      title: "Notion lavora sui tuoi file di Google Drive",
      text: "Mette mano a documenti, fogli e presentazioni di Google Drive senza farti uscire da Notion.",
    },
    {
      title: "Google Forms con Gemini",
      text: "Legge le risposte dei tuoi moduli e ti suggerisce i prossimi passi.",
    },
    {
      title: "ChatGPT: chat e Codex sotto lo stesso limite d'uso",
      text: "Cambia da dicembre.",
    },
  ],
  pillolaUrl: "https://bobtiautomatizza.com/lunedi-ai/2026-11-09",
  videos: [
    {
      title:
        "Report Meta Ads con Claude: lo imposti una volta e poi basta un clic",
      url: "https://bobtiautomatizza.com/video/report-meta-ads-claude",
    },
  ],
} satisfies LunediAIProps;

export default LunediAI;
