import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { nav, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pt-12 pb-10 text-sm sm:px-6">
      <div className="grid gap-8 sm:grid-cols-3">
        <div>
          <p className="font-heading text-base font-bold">{site.name}</p>
          <p className="mt-2 max-w-xs text-muted-foreground">{site.sub}</p>
        </div>
        <nav aria-label="Contenuti" className="flex flex-col gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-2">
          <a href={site.youtube} className="hover:text-primary">
            YouTube
          </a>
          <a href={site.instagram} className="hover:text-primary">
            Instagram
          </a>
          <a href={site.linkedin} className="hover:text-primary">
            LinkedIn
          </a>
        </div>
      </div>
      <Separator className="my-8" />
      <div className="flex flex-col gap-2 text-muted-foreground sm:flex-row sm:justify-between">
        <p>
          {site.owner} · P.IVA {site.vat}
        </p>
        <nav aria-label="Note legali" className="flex gap-4">
          <Link href="/privacy" className="hover:text-primary">
            Privacy
          </Link>
          <Link href="/cookie" className="hover:text-primary">
            Cookie
          </Link>
        </nav>
      </div>
    </footer>
  );
}
