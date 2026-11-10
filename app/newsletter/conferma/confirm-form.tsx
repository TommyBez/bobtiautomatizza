"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type ConfirmState, confirm } from "@/app/newsletter/actions";
import { Button, buttonVariants } from "@/components/ui/button";

const initial: ConfirmState = { status: "idle" };

export function ConfirmForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(confirm, initial);

  if (state.status === "ok") {
    return (
      <output className="block">
        <h1 className="font-heading text-4xl font-bold">
          Ci sei. Ci vediamo lunedì.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          La prima pillola ti arriva lunedì prossimo all&apos;indirizzo {email}.
          Intanto puoi guardare i video già usciti.
        </p>
        <Link
          href="/video"
          className={buttonVariants({
            size: "lg",
            className: "mt-8 h-12 rounded-xl px-5 text-base",
          })}
        >
          Guarda i video
        </Link>
      </output>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="t" value={token} />
      <h1 className="font-heading text-4xl font-bold">
        Conferma la tua iscrizione
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Stai per iscrivere <strong className="text-foreground">{email}</strong>{" "}
        a Il lunedì dell&apos;AI: ogni lunedì le novità AI della settimana e i
        video usciti nei giorni prima. Ti cancelli quando vuoi con un clic.
      </p>
      <Button
        type="submit"
        disabled={pending}
        className="mt-8 h-12 rounded-xl px-6 text-base font-semibold"
      >
        {pending ? "Un attimo…" : "Conferma l'iscrizione"}
      </Button>
      {state.status === "error" ? (
        <p role="alert" className="mt-4">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
