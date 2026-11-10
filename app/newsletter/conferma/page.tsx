import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Bob } from "@/components/bob";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { readConfirmToken } from "@/lib/newsletter";
import { ConfirmForm } from "./confirm-form";

export const metadata: Metadata = {
  title: "Conferma l'iscrizione",
  robots: { index: false, follow: false },
};

// Il clic sul link dell'email apre solo questa pagina: l'iscrizione parte dal pulsante,
// così i filtri antispam che aprono i link da soli non confermano al posto delle persone.
export default function ConfermaPage(props: PageProps<"/newsletter/conferma">) {
  return (
    <div className="mx-auto grid max-w-3xl items-center gap-10 px-4 pt-10 pb-20 sm:px-6 md:grid-cols-[1fr_auto]">
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
        <Conferma searchParams={props.searchParams} />
      </Suspense>
      <Bob size={240} eager className="mx-auto hidden md:block" />
    </div>
  );
}

async function Conferma({
  searchParams,
}: {
  searchParams: PageProps<"/newsletter/conferma">["searchParams"];
}) {
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";
  // La scadenza del link dipende dal momento in cui viene aperto: si calcola alla richiesta.
  await connection();
  const pending = token ? readConfirmToken(token) : null;

  if (!pending) {
    return (
      <div>
        <h1 className="font-heading text-4xl font-bold">
          Questo link non funziona più
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Il link di conferma è scaduto o non è completo. Iscriviti di nuovo e
          ti mando un link fresco.
        </p>
        <Link
          href="/newsletter"
          className={buttonVariants({
            size: "lg",
            className: "mt-8 h-12 rounded-xl px-5 text-base",
          })}
        >
          Torna all&apos;iscrizione
        </Link>
      </div>
    );
  }

  return <ConfirmForm token={token} email={pending.email} />;
}
