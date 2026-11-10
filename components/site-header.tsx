import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { Bob } from "@/components/bob";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { nav, site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Bob size={44} />
        <span className="font-heading text-lg font-bold">{site.name}</span>
      </Link>

      <nav
        aria-label="Principale"
        className="hidden items-center gap-7 text-[15px] md:flex"
      >
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="hover:text-primary">
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Link
          href="/newsletter"
          className={buttonVariants({
            size: "lg",
            className: "rounded-full px-4",
          })}
        >
          Iscriviti
        </Link>
        <Sheet>
          <SheetTrigger
            className={buttonVariants({
              variant: "ghost",
              size: "icon-lg",
              className: "md:hidden",
            })}
            aria-label="Apri il menu"
          >
            <MenuIcon />
          </SheetTrigger>
          <SheetContent side="right" className="bg-background">
            <SheetHeader>
              <SheetTitle className="font-heading text-lg">
                {site.name}
              </SheetTitle>
            </SheetHeader>
            <nav aria-label="Menu" className="flex flex-col px-4">
              {nav.map((item) => (
                <SheetClose
                  key={item.href}
                  render={<Link href={item.href} />}
                  className="border-b py-3 text-lg font-medium"
                >
                  {item.label}
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
