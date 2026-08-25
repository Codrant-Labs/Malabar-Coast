import {getSanityClient} from "./client";
import {legalPageQuery} from "./queries";
import type {Metadata} from "next";

export type PortableTextSpan = {
  _key?: string;
  _type?: "span";
  text?: string;
  marks?: string[];
};

export type PortableTextMarkDefinition = {
  _key?: string;
  _type?: string;
  href?: string;
};

export type PortableTextBlock = {
  _key?: string;
  _type?: "block";
  style?: "normal" | "h3" | "blockquote";
  listItem?: "bullet" | "number";
  level?: number;
  children?: PortableTextSpan[];
  markDefs?: PortableTextMarkDefinition[];
};

export type LegalPageRecord = {
  pageKey: string;
  title: string;
  eyebrow?: string;
  summary?: string;
  lastUpdated?: string;
  sections?: Array<{
    _key: string;
    id: string;
    title: string;
    body: PortableTextBlock[];
  }>;
  seo?: {
    title?: string;
    description?: string;
    noIndex?: boolean;
    image?: {url: string; alt?: string};
  };
};

export async function getLegalPage(pageKey: string): Promise<LegalPageRecord | null> {
  const client = getSanityClient();
  if (!client) return null;
  try {
    const page = await client.fetch(legalPageQuery, {pageKey}, {
      next: {revalidate: 60, tags: [`sanity-legal-${pageKey}`]},
    }) as LegalPageRecord | null;
    return page?.sections?.length ? page : null;
  } catch (error) {
    console.error(`Sanity ${pageKey} legal page fetch failed; using checked-in policy copy.`, error instanceof Error ? error.name : "UnknownError");
    return null;
  }
}

export async function getLegalPageMetadata(pageKey: string, canonical: string, fallback: Metadata): Promise<Metadata> {
  const page = await getLegalPage(pageKey);
  const title = page?.seo?.title || page?.title || fallback.title;
  const description = page?.seo?.description || page?.summary || fallback.description;
  return {
    ...fallback,
    title,
    description,
    alternates: {canonical},
    robots: page?.seo?.noIndex ? {index: false, follow: false} : fallback.robots,
    openGraph: page?.seo?.image?.url ? {
      title: typeof title === "string" ? title : undefined,
      description: typeof description === "string" ? description : undefined,
      url: canonical,
      images: [{url: page.seo.image.url, alt: page.seo.image.alt || page.title}],
    } : fallback.openGraph,
  };
}
