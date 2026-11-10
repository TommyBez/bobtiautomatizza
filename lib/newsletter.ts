import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { ConfermaIscrizione } from "@/emails/conferma-iscrizione";
import { site } from "@/lib/site";

// ID su Resend (non segreti): segmento della lista, argomento per la disiscrizione, campo "attivita".
export const resendIds = {
  segment: "ff318f29-a8cf-4385-9fdd-9ec4cdbe59d5",
  topic: "98bf42c3-297b-4fe7-b4cd-e6b0b754b6d8",
};

export const newsletterFrom = `${site.name} <bob@bobtiautomatizza.com>`;

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type Pending = { email: string; attivita: string; issuedAt: number };

function requireEnv(name: "RESEND_API_KEY" | "NEWSLETTER_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`Variabile d'ambiente mancante: ${name}`);
  return value;
}

const resend = () => new Resend(requireEnv("RESEND_API_KEY"));

const sign = (payload: string) =>
  createHmac("sha256", requireEnv("NEWSLETTER_SECRET"))
    .update(payload)
    .digest("base64url");

/** Token firmato e senza stato: l'iscrizione non viene salvata finché non è confermata. */
export function createConfirmToken(email: string, attivita: string) {
  const payload = Buffer.from(
    JSON.stringify({ email, attivita, issuedAt: Date.now() } satisfies Pending),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readConfirmToken(token: string): Pending | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given))
    return null;
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as Pending;
    if (Date.now() - data.issuedAt > TOKEN_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export async function sendConfirmationEmail(
  email: string,
  attivita: string,
  origin: string,
) {
  const url = `${origin}/newsletter/conferma?t=${createConfirmToken(email, attivita)}`;
  const { error } = await resend().emails.send({
    from: newsletterFrom,
    to: email,
    subject: "Conferma la tua iscrizione a Il lunedì dell'AI",
    react: ConfermaIscrizione({
      confirmUrl: url,
      logoUrl: `${origin}/email/bob.png`,
    }),
  });
  if (error) throw new Error(`Invio conferma non riuscito: ${error.name}`);
}

/**
 * Iscrive il contatto: lo crea se non esiste, altrimenti lo aggiunge a segmento e argomento.
 * I contatti Resend sono condivisi da tutto l'account, quindi non tocchiamo mai `unsubscribed`:
 * l'iscrizione a Bob passa solo da segmento + argomento "Il lunedì dell'AI".
 */
export async function subscribeContact({ email, attivita }: Pending) {
  const client = resend();
  const properties = attivita ? { attivita } : undefined;

  const existing = await client.contacts.get({ email });
  if (existing.error && existing.error.name !== "not_found") {
    throw new Error(`Lettura contatto non riuscita: ${existing.error.name}`);
  }

  if (!existing.data) {
    const { error } = await client.contacts.create({
      email,
      properties,
      segments: [{ id: resendIds.segment }],
      topics: [{ id: resendIds.topic, subscription: "opt_in" }],
    });
    if (error)
      throw new Error(`Creazione contatto non riuscita: ${error.name}`);
    return;
  }

  const steps = await Promise.all([
    client.contacts.segments.add({ email, segmentId: resendIds.segment }),
    client.contacts.topics.update({
      email,
      topics: [{ id: resendIds.topic, subscription: "opt_in" }],
    }),
    properties
      ? client.contacts.update({ email, properties })
      : Promise.resolve({ error: null }),
  ]);
  const failed = steps.find((s) => s.error);
  if (failed?.error)
    throw new Error(
      `Aggiornamento contatto non riuscito: ${failed.error.name}`,
    );
}
