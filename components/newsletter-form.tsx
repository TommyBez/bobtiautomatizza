"use client";

import { cn } from "cn";
import Link from "next/link";
import { useActionState } from "react";
import { type SubscribeState, subscribe } from "@/app/newsletter/actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { businessTypes } from "@/lib/site";

const initial: SubscribeState = { status: "idle" };

export function NewsletterForm({
  tone = "light",
  className,
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const [state, action, pending] = useActionState(subscribe, initial);
  const dark = tone === "dark";

  if (state.status === "sent") {
    return (
      <output
        className={cn(
          "block rounded-xl px-4 py-3",
          dark ? "bg-white/10" : "bg-card",
        )}
      >
        <p className="font-semibold">Controlla la tua email.</p>
        <p
          className={cn(
            "mt-1 text-sm",
            dark ? "text-white/80" : "text-muted-foreground",
          )}
        >
          Ti ho mandato un link: cliccalo per confermare l&apos;iscrizione. Se
          non la trovi, guarda nello spam.
        </p>
      </output>
    );
  }

  return (
    <form action={action} className={cn("w-full", className)}>
      <FieldGroup className="gap-3">
        {/* Campo trappola per i bot: nascosto alle persone e ai lettori di schermo. */}
        <input
          type="text"
          name="sito"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />
        <Field>
          <FieldLabel htmlFor={`email-${tone}`} className="sr-only">
            La tua email
          </FieldLabel>
          <Input
            id={`email-${tone}`}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="La tua email"
            aria-invalid={state.status === "error" || undefined}
            className={cn(
              "h-12 rounded-xl px-4 text-base",
              dark
                ? "border-white/25 bg-white/10 text-white placeholder:text-white/60"
                : "bg-card",
            )}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`business-${tone}`} className="sr-only">
            Che tipo di attività hai? (facoltativo)
          </FieldLabel>
          <NativeSelect
            id={`business-${tone}`}
            name="business"
            defaultValue=""
            className={cn(
              "w-full [&_select]:h-12 [&_select]:rounded-xl [&_select]:px-4 [&_select]:text-base",
              dark
                ? "[&_select]:border-white/25 [&_select]:bg-white/10 [&_select]:text-white [&_svg]:text-white/70"
                : "[&_select]:bg-card",
            )}
          >
            <NativeSelectOption value="">
              Che attività hai? (facoltativo)
            </NativeSelectOption>
            {businessTypes.map((b) => (
              <NativeSelectOption key={b} value={b}>
                {b}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Button
          type="submit"
          disabled={pending}
          className={cn(
            "h-12 rounded-xl text-base font-semibold",
            dark && "bg-background text-primary hover:bg-paper",
          )}
        >
          {pending ? "Un attimo…" : "Iscriviti"}
        </Button>
        {state.status === "error" ? (
          <p
            role="alert"
            className={cn("text-sm", dark ? "text-white" : "text-foreground")}
          >
            {state.message}
          </p>
        ) : null}
        <FieldDescription className={cn(dark && "text-white/70")}>
          Ogni lunedì le novità AI della settimana e i video usciti nei giorni
          prima. Ti cancelli con un clic.{" "}
          <Link
            href="/privacy"
            className={cn(
              "underline underline-offset-4",
              dark ? "text-white" : "text-foreground",
            )}
          >
            Informativa privacy
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
