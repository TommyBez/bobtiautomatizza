"use server";

import { headers } from "next/headers";
import {
  readConfirmToken,
  sendConfirmationEmail,
  subscribeContact,
} from "@/lib/newsletter";
import { businessTypes, site } from "@/lib/site";

export type SubscribeState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; message: string };

export type ConfirmState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error"; message: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// L'origine dei link nelle email non viene mai presa dagli header in produzione:
// un header `host` falsificato farebbe partire dal nostro dominio link verso un altro sito.
async function linkOrigin() {
  if (process.env.VERCEL_ENV === "production") return site.url;
  const vercelUrl = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  const host = (await headers()).get("host") ?? "localhost:3000";
  return `http://${host}`;
}

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  // Campo trappola: invisibile alle persone, i bot lo compilano.
  if (String(formData.get("sito") ?? "")) return { status: "sent" };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const attivita = String(formData.get("business") ?? "");

  if (!emailPattern.test(email) || email.length > 254) {
    return { status: "error", message: "Controlla l'indirizzo email." };
  }
  if (attivita && !businessTypes.includes(attivita)) {
    return { status: "error", message: "Tipo di attività non valido." };
  }

  try {
    await sendConfirmationEmail(email, attivita, await linkOrigin());
    return { status: "sent" };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Non sono riuscito a inviarti l'email. Riprova tra poco.",
    };
  }
}

export async function confirm(
  _prev: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const pending = readConfirmToken(String(formData.get("t") ?? ""));
  if (!pending) {
    return {
      status: "error",
      message: "Il link non è valido o è scaduto. Iscriviti di nuovo dal sito.",
    };
  }
  try {
    await subscribeContact(pending);
    return { status: "ok" };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Qualcosa è andato storto. Riprova tra poco.",
    };
  }
}
