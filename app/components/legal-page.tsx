import Link from "next/link";
import {Fragment, type ReactNode} from "react";
import {getLegalPage, type PortableTextBlock, type PortableTextSpan} from "@/sanity/lib/legal";
import {isSafePublicHref} from "@/sanity/lib/links";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  sections: LegalSection[];
  lastReviewed?: string;
  lastReviewedDate?: string;
};

const policyLinks = [
  { href: "/payments", label: "Payments & terms" },
  { href: "/returns", label: "Returns & cancellations" },
  { href: "/cookie", label: "Cookie policy" },
  { href: "/privacy", label: "Privacy policy" },
];

function PortableSpan({span, block}: {span: PortableTextSpan; block: PortableTextBlock}) {
  let content: ReactNode = span.text || "";
  for (const mark of span.marks || []) {
    if (mark === "strong") content = <strong>{content}</strong>;
    else if (mark === "em") content = <em>{content}</em>;
    else if (mark === "code") content = <code>{content}</code>;
    else {
      const definition = block.markDefs?.find((entry) => entry._key === mark);
      if (definition?.href && isSafePublicHref(definition.href)) {
        const external = definition.href.startsWith("https://");
        content = <a href={definition.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>{content}</a>;
      }
    }
  }
  return <Fragment>{content}</Fragment>;
}

function blockChildren(block: PortableTextBlock) {
  return block.children?.map((span) => <PortableSpan block={block} span={span} key={span._key || span.text} />);
}

function PortableContent({blocks}: {blocks: PortableTextBlock[]}) {
  const rendered: ReactNode[] = [];
  for (let index = 0; index < blocks.length;) {
    const block = blocks[index];
    if (block.listItem) {
      const kind = block.listItem;
      const items: ReactNode[] = [];
      while (index < blocks.length && blocks[index].listItem === kind) {
        const item = blocks[index];
        items.push(<li key={item._key || index}>{blockChildren(item)}</li>);
        index += 1;
      }
      rendered.push(kind === "number" ? <ol key={`list-${index}`}>{items}</ol> : <ul key={`list-${index}`}>{items}</ul>);
      continue;
    }
    const children = blockChildren(block);
    if (block.style === "h3") rendered.push(<h3 key={block._key || index}>{children}</h3>);
    else if (block.style === "blockquote") rendered.push(<blockquote key={block._key || index}>{children}</blockquote>);
    else rendered.push(<p key={block._key || index}>{children}</p>);
    index += 1;
  }
  return rendered;
}

export function LegalPage({ eyebrow, title, summary, sections, lastReviewed = "15 August 2026", lastReviewedDate = "2026-08-15" }: LegalPageProps) {
  return (
    <main className="legalPage">
      <header className="legalHero">
        <div className="legalHeroMeta">
          <p>{eyebrow}</p>
          <span>Malabar Coast · Holytown</span>
        </div>
        <h1>{title}</h1>
        <div className="legalHeroSummary">
          <p>{summary}</p>
          <time dateTime={lastReviewedDate}>Last reviewed {lastReviewed}</time>
        </div>
      </header>

      <div className="legalLayout">
        <aside className="legalIndex" aria-label="On this page">
          <p>On this page</p>
          <nav>
            {sections.map((section, index) => (
              <a href={`#${section.id}`} key={section.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <article className="legalDocument">
          {sections.map((section, index) => (
            <section id={section.id} key={section.id}>
              <div className="legalSectionHeading">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{section.title}</h2>
              </div>
              <div className="legalSectionBody">{section.content}</div>
            </section>
          ))}
        </article>
      </div>

      <nav className="legalPolicyNav" aria-label="Legal and policy pages">
        <p>Policies & information</p>
        <div>
          {policyLinks.map((link) => (
            <Link href={link.href} key={link.href}>{link.label}<span aria-hidden="true">↗</span></Link>
          ))}
        </div>
      </nav>
    </main>
  );
}

function formatPolicyDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", {day: "numeric", month: "long", year: "numeric", timeZone: "UTC"}).format(date);
}

export async function ManagedLegalPage({pageKey, ...fallback}: LegalPageProps & {pageKey: string}) {
  const page = await getLegalPage(pageKey);
  if (!page?.sections?.length) return <LegalPage {...fallback} />;
  return <LegalPage
    eyebrow={page.eyebrow || fallback.eyebrow}
    title={page.title || fallback.title}
    summary={page.summary || fallback.summary}
    lastReviewedDate={page.lastUpdated || fallback.lastReviewedDate}
    lastReviewed={page.lastUpdated ? formatPolicyDate(page.lastUpdated) : fallback.lastReviewed}
    sections={page.sections.map((section) => ({
      id: section.id,
      title: section.title,
      content: <PortableContent blocks={section.body} />,
    }))}
  />;
}
