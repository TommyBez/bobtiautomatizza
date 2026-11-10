import Link from "next/link";
import { Fragment } from "react";
import { JsonLd } from "@/components/json-ld";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { site } from "@/lib/site";

type Crumb = { label: string; href?: string };

/** Breadcrumb visibile + dati strutturati BreadcrumbList. */
export function PageBreadcrumb({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: new URL(c.href, site.url).toString() } : {}),
    })),
  };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          {all.map((c, i) => (
            <Fragment key={c.label}>
              {i > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {c.href ? (
                  <BreadcrumbLink render={<Link href={c.href} />}>
                    {c.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="line-clamp-1">
                    {c.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <JsonLd data={jsonLd} />
    </>
  );
}
