import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Bob } from "@/components/bob";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import type { Pillola, Video } from "@/lib/content";
import { formatDate, formatShortDate, metodo, site } from "@/lib/site";

/** Elenco di video a righe, stile "quaderno". */
export function VideoList({ videos }: { videos: Video[] }) {
  return (
    <ItemGroup className="divide-y divide-border">
      {videos.map((v) => (
        <Item
          key={v.slug}
          render={<Link href={`/video/${v.slug}`} />}
          className="items-start gap-4 rounded-none px-0 py-5 [a]:hover:bg-transparent sm:gap-6"
        >
          <span className="w-14 shrink-0 pt-1 font-mono text-xs text-muted-foreground">
            {formatShortDate(v.date)}
          </span>
          <ItemContent>
            <ItemTitle className="font-heading text-xl leading-snug font-semibold group-hover/item:text-primary">
              {v.title}
            </ItemTitle>
            <ItemDescription className="line-clamp-none text-[15px]">
              {v.description}
            </ItemDescription>
          </ItemContent>
          <ItemActions className="hidden flex-wrap gap-1.5 sm:flex">
            {v.tools.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}

/** La pillola come foglietto a righe. */
export function PillolaNote({ pillola }: { pillola: Pillola }) {
  return (
    <Card className="h-fit rotate-1 rounded-sm bg-paper bg-[linear-gradient(transparent_31px,color-mix(in_oklab,var(--jeans)_25%,transparent)_32px)] bg-size-[100%_32px] shadow-[0_12px_30px_-12px_rgb(34_38_27/0.35)] ring-0">
      <CardHeader className="px-6">
        <p className="font-mono text-xs tracking-widest text-primary uppercase">
          {site.monday}
        </p>
        <p className="font-heading text-2xl font-bold">{pillola.title}</p>
        <p className="text-muted-foreground">{pillola.period}</p>
      </CardHeader>
      <CardContent className="px-6">
        <ol className="space-y-3">
          {pillola.items.map((item, i) => (
            <li key={item.title} className="text-[15px] leading-8">
              <span className="font-semibold">
                {i + 1}. {item.title}
              </span>
              {item.text ? (
                <span className="block text-muted-foreground">{item.text}</span>
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
      <CardFooter className="border-0 bg-transparent px-6 pb-6">
        <Link
          href={`${site.mondayPath}/${pillola.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          Guarda la pillola <ArrowRightIcon className="size-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}

/** Anteprima di cosa arriva il lunedì, costruita con i contenuti veri. */
export function EmailPreview({
  pillola,
  videos,
}: {
  pillola: Pillola;
  videos: Video[];
}) {
  return (
    <Card className="gap-0 rounded-2xl bg-card py-0 text-base text-foreground shadow-[0_20px_50px_-20px_rgb(34_38_27/0.5)]">
      <div className="flex items-center gap-3 border-b px-5 py-3 text-sm">
        <Bob size={40} />
        <div className="min-w-0">
          <p className="font-semibold">{site.name}</p>
          <p className="truncate text-muted-foreground">
            {site.monday} · {formatDate(pillola.date)}
          </p>
        </div>
      </div>
      <div className="px-5 py-6 sm:px-7">
        <p>Ciao, ecco le novità AI di questa settimana.</p>
        <ol className="mt-4 space-y-3">
          {pillola.items.map((item, i) => (
            <li key={item.title} className="border-l-4 border-olive-light pl-4">
              <p className="font-semibold">
                {i + 1}. {item.title}
              </p>
              {item.text ? (
                <p className="text-muted-foreground">{item.text}</p>
              ) : null}
            </li>
          ))}
        </ol>
        {videos.length > 0 ? (
          <>
            <p className="mt-6 font-mono text-xs tracking-widest text-muted-foreground uppercase">
              I video della settimana
            </p>
            <ul className="mt-2 space-y-1.5">
              {videos.map((v) => (
                <li key={v.slug}>
                  <Link
                    href={`/video/${v.slug}`}
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    {v.youtubeTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="mt-6">A lunedì prossimo,</p>
        <p className="font-heading text-xl font-bold">Bob</p>
      </div>
    </Card>
  );
}

/** I tre passi del metodo. */
export function MetodoSteps() {
  return (
    <ol className="grid gap-8 md:grid-cols-3">
      {metodo.map((m) => (
        <li
          key={m.n}
          className="border-t-2 border-dashed border-foreground/30 pt-5"
        >
          <span className="font-heading text-5xl font-bold text-primary">
            {m.n}
          </span>
          <h3 className="mt-2 text-xl font-semibold">{m.title}</h3>
          <p className="mt-1 text-muted-foreground">{m.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs tracking-widest text-primary uppercase">
      {children}
    </p>
  );
}
