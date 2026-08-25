import {readdir} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import {createClient} from "next-sanity";

type HtmlNode = {
  nodeType: number;
  rawTagName?: string;
  text: string;
  childNodes: HtmlNode[];
  parentNode?: HtmlNode;
  getAttribute(name: string): string | undefined;
  querySelector(selector: string): HtmlNode | null;
  querySelectorAll(selector: string): HtmlNode[];
};

type Span = {_type: "span"; _key: string; text: string; marks: string[]};
type MarkDefinition = {_type: "link"; _key: string; href: string};

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_TOKEN?.trim();
if (!projectId || !token) throw new Error("Sanity project configuration or write token is missing.");

const client = createClient({projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false});

async function htmlParser() {
  const modules = join(process.cwd(), "node_modules", ".pnpm");
  const packageDirectory = (await readdir(modules)).find((name) => name.startsWith("node-html-parser@"));
  if (!packageDirectory) throw new Error("The installed HTML parser could not be found.");
  const modulePath = join(modules, packageDirectory, "node_modules", "node-html-parser", "dist", "index.js");
  const imported = await import(pathToFileURL(modulePath).href) as {parse(value: string): HtmlNode};
  return imported.parse;
}

function safeHref(value: string | undefined) {
  if (!value) return undefined;
  if ((value.startsWith("/") && !value.startsWith("//")) || value.startsWith("#") || /^(mailto|tel):/i.test(value)) return value;
  try { return new URL(value).protocol === "https:" ? value : undefined; } catch { return undefined; }
}

function inlineContent(node: HtmlNode, keyPrefix: string, inheritedMarks: string[] = [], definitions: MarkDefinition[] = []): {spans: Span[]; definitions: MarkDefinition[]} {
  if (node.nodeType === 3) {
    const text = node.text.replace(/\s+/g, " ");
    return {spans: text ? [{_type: "span", _key: `${keyPrefix}-span`, text, marks: inheritedMarks}] : [], definitions};
  }
  const tag = node.rawTagName?.toLowerCase();
  let marks = inheritedMarks;
  if (tag === "strong" || tag === "b") marks = [...marks, "strong"];
  if (tag === "em" || tag === "i") marks = [...marks, "em"];
  if (tag === "a") {
    const href = safeHref(node.getAttribute("href"));
    if (href) {
      const mark = `${keyPrefix}-link`;
      definitions.push({_type: "link", _key: mark, href});
      marks = [...marks, mark];
    }
  }
  const spans = node.childNodes.flatMap((child, index) => inlineContent(child, `${keyPrefix}-${index}`, marks, definitions).spans);
  return {spans, definitions};
}

function bodyBlocks(body: HtmlNode, pageKey: string, sectionId: string) {
  let blockIndex = 0;
  return body.querySelectorAll("p,li,h3,blockquote,tr").flatMap((node) => {
    const tag = node.rawTagName?.toLowerCase();
    if (tag === "p" && node.parentNode?.rawTagName?.toLowerCase() === "li") return [];
    const key = `${pageKey}-${sectionId}-${blockIndex++}`;
    const {spans, definitions} = inlineContent(node, key);
    const children = spans.map((span) => ({...span, text: span.text.trim()})).filter((span) => span.text);
    if (!children.length) return [];
    return [{
      _type: "block",
      _key: key,
      style: tag === "h3" ? "h3" : tag === "blockquote" ? "blockquote" : "normal",
      ...(tag === "li" ? {listItem: node.parentNode?.rawTagName?.toLowerCase() === "ol" ? "number" : "bullet", level: 1} : {}),
      markDefs: definitions,
      children,
    }];
  });
}

async function main() {
  const parse = await htmlParser();
  const transaction = client.transaction();
  const synced: Array<{pageKey: string; sections: number}> = [];
  for (const pageKey of ["payments", "privacy", "returns", "cookie"]) {
    const existing = await client.fetch<{_id: string; sections?: unknown[]} | null>(`*[_type == "legalPage" && pageKey == $pageKey][0]{_id, sections}`, {pageKey});
    if (!existing || existing.sections?.length) continue;
    const response = await fetch(`http://localhost:3100/${pageKey}`, {signal: AbortSignal.timeout(15_000)});
    if (!response.ok) throw new Error(`Local ${pageKey} page returned ${response.status}.`);
    const root = parse(await response.text());
    const sections = root.querySelectorAll("article.legalDocument > section").map((section, index) => {
      const id = section.getAttribute("id") || `${pageKey}-${index + 1}`;
      const title = section.querySelector("h2")?.text.trim() || `Section ${index + 1}`;
      const body = section.querySelector(".legalSectionBody");
      if (!body) throw new Error(`Local ${pageKey} section ${id} has no body.`);
      return {_type: "object", _key: `${pageKey}-${id}`, sectionId: {_type: "slug", current: id}, title, body: bodyBlocks(body, pageKey, id)};
    });
    if (!sections.length || sections.some((section) => !section.body.length)) throw new Error(`Local ${pageKey} policy could not be converted safely.`);
    transaction.patch(existing._id, (patch) => patch.set({sections}));
    synced.push({pageKey, sections: sections.length});
  }
  if (synced.length) await transaction.commit();
  console.log(JSON.stringify({synced}, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Legal content sync failed.");
  process.exitCode = 1;
});
