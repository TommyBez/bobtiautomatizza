import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "react-email";
import { color, font } from "./theme";

type Props = {
  confirmUrl: string;
  logoUrl: string;
};

export function ConfermaIscrizione({ confirmUrl, logoUrl }: Props) {
  return (
    <Html lang="it">
      <Head />
      <Preview>
        Un clic e sei dentro: conferma l&apos;iscrizione a Il lunedì
        dell&apos;AI.
      </Preview>
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
            maxWidth: 520,
            padding: "32px 32px 24px",
            border: `1px solid ${color.border}`,
          }}
        >
          <Img
            src={logoUrl}
            alt="Bob"
            width={67}
            height={120}
            style={{ margin: "0 auto 16px" }}
          />
          <Heading
            as="h1"
            style={{
              color: color.ink,
              fontSize: 26,
              lineHeight: "32px",
              margin: "0 0 12px",
              textAlign: "center",
            }}
          >
            Manca solo un clic
          </Heading>
          <Text
            style={{
              color: color.ink,
              fontSize: 16,
              lineHeight: "26px",
              margin: "0 0 8px",
            }}
          >
            Hai chiesto di ricevere <strong>Il lunedì dell&apos;AI</strong>:
            ogni lunedì le novità AI della settimana e i video usciti nei giorni
            prima, spiegati in modo semplice.
          </Text>
          <Text
            style={{
              color: color.ink,
              fontSize: 16,
              lineHeight: "26px",
              margin: "0 0 24px",
            }}
          >
            Per confermare che questo indirizzo è tuo, clicca qui sotto.
          </Text>
          <Section style={{ textAlign: "center", margin: "0 0 24px" }}>
            <Button
              href={confirmUrl}
              style={{
                backgroundColor: color.olive,
                borderRadius: 12,
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 600,
                padding: "14px 28px",
              }}
            >
              Conferma l&apos;iscrizione
            </Button>
          </Section>
          <Text
            style={{
              color: color.muted,
              fontSize: 13,
              lineHeight: "20px",
              margin: 0,
            }}
          >
            Se non hai chiesto tu l&apos;iscrizione, ignora questa email: senza
            conferma non ricevi niente. Il link vale 7 giorni.
          </Text>
        </Container>
        <Text
          style={{
            color: color.muted,
            fontSize: 12,
            textAlign: "center",
            margin: "16px 0 0",
          }}
        >
          Bob ti automatizza · bobtiautomatizza.com
        </Text>
      </Body>
    </Html>
  );
}

ConfermaIscrizione.PreviewProps = {
  confirmUrl: "https://bobtiautomatizza.com/newsletter/conferma?t=esempio",
  logoUrl: "https://bobtiautomatizza.com/email/bob.png",
} satisfies Props;

export default ConfermaIscrizione;
