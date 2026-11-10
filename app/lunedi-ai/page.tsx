import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { getPillole } from "@/lib/content";
import { formatDate, site } from "@/lib/site";

export const metadata: Metadata = {
  title: site.monday,
  description:
    "Ogni lunedì le novità AI della settimana che possono cambiarti il lavoro, in un video breve.",
  alternates: { canonical: site.mondayPath },
};

export default async function PillolePage() {
  const pillole = await getPillole();

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6">
      <h1 className="font-heading text-4xl font-bold sm:text-5xl">
        {site.monday}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Ogni lunedì le novità AI della settimana che possono cambiarti il
        lavoro, in un video breve.
      </p>

      <ItemGroup className="mt-10 divide-y divide-border border-y">
        {pillole.map((p) => (
          <Item
            key={p.slug}
            render={<Link href={`${site.mondayPath}/${p.slug}`} />}
            className="items-start gap-6 rounded-none px-0 py-6 [a]:hover:bg-transparent"
          >
            <ItemContent>
              <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                {formatDate(p.date)}
              </p>
              <ItemTitle className="font-heading text-2xl font-bold group-hover/item:text-primary">
                {p.title}
              </ItemTitle>
              <ItemDescription className="line-clamp-none text-base">
                {p.items.map((i) => i.title).join(" · ")}
              </ItemDescription>
            </ItemContent>
            <ItemActions className="pt-6">
              <ArrowRightIcon className="size-5 text-primary" />
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>

      <section className="mt-14">
        <h2 className="font-heading text-2xl font-bold">
          La pillola anche nella tua email
        </h2>
        <NewsletterForm className="mt-4 max-w-md" />
      </section>
    </div>
  );
}
