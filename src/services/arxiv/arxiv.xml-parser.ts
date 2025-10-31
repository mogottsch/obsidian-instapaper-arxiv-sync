import { Result, ok, err } from "../../utils/result";
import { ArxivError } from "../../types/errors";
import { ArxivFeedEntry } from "./arxiv.types";

export function parseArxivXml(xmlText: string): Result<ArxivFeedEntry[], ArxivError> {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");

    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      return err({
        type: "PARSE_ERROR",
        message: "Failed to parse XML response",
      });
    }

    const entries = doc.querySelectorAll("entry");
    const papers: ArxivFeedEntry[] = [];

    for (const entry of Array.from(entries)) {
      const parsed = parseEntry(entry);
      if (parsed.success) {
        papers.push(parsed.value);
      }
    }

    return ok(papers);
  } catch (error) {
    return err({
      type: "PARSE_ERROR",
      message: error instanceof Error ? error.message : "Unknown parse error",
    });
  }
}

function getTextContent(element: Element | null): string {
  const text = element?.textContent ?? "";
  return text.trim();
}

function extractArxivId(idText: string): Result<string, ArxivError> {
  const idMatch = /(\d{4}\.\d{4,5})/.exec(idText);
  const id = idMatch?.[1] ?? "";
  if (id.length === 0) {
    return err({ type: "PARSE_ERROR", message: "Invalid entry ID format" });
  }
  return ok(id);
}

function extractAuthors(entry: Element): string[] {
  const authorElements = entry.querySelectorAll("author name");
  return Array.from(authorElements)
    .map((el) => getTextContent(el))
    .filter((name) => name.length > 0);
}

function extractCategories(entry: Element): string[] {
  const categoryElements = entry.querySelectorAll("category");
  return Array.from(categoryElements)
    .map((el) => el.getAttribute("term"))
    .filter((term): term is string => term !== null && term.length > 0);
}

function extractPrimaryCategory(entry: Element, categories: string[]): string {
  const primaryCategoryEl = entry.querySelector("arxiv\\:primary_category, primary_category");
  const term = primaryCategoryEl?.getAttribute("term");
  return term ?? categories[0] ?? "unknown";
}

function extractPdfLink(entry: Element, arxivId: string): string {
  const links = entry.querySelectorAll("link");
  for (const link of Array.from(links)) {
    if (link.getAttribute("title") === "pdf") {
      const href = link.getAttribute("href") ?? "";
      if (href.length > 0) {
        return href;
      }
    }
  }
  return `https://arxiv.org/pdf/${arxivId}.pdf`;
}

function parseEntry(entry: Element): Result<ArxivFeedEntry, ArxivError> {
  try {
    const idElement = entry.querySelector("id");
    const idText = getTextContent(idElement);
    if (idText.length === 0) {
      return err({ type: "PARSE_ERROR", message: "Missing entry ID" });
    }

    const arxivIdResult = extractArxivId(idText);
    if (!arxivIdResult.success) {
      return arxivIdResult;
    }
    const arxivId = arxivIdResult.value;

    const title = getTextContent(entry.querySelector("title"));
    const authors = extractAuthors(entry);
    const summary = getTextContent(entry.querySelector("summary"));
    const published = getTextContent(entry.querySelector("published"));
    const categories = extractCategories(entry);
    const primaryCategory = extractPrimaryCategory(entry, categories);
    const pdfLink = extractPdfLink(entry, arxivId);

    const hasTitle = title.length > 0;
    const hasSummary = summary.length > 0;
    const finalTitle = hasTitle ? title : "Untitled";
    const finalSummary = hasSummary ? summary : "No abstract available";

    return ok({
      id: arxivId,
      title: cleanText(finalTitle),
      authors,
      summary: cleanText(finalSummary),
      published,
      categories,
      primaryCategory,
      pdfLink,
    });
  } catch (error) {
    return err({
      type: "PARSE_ERROR",
      message: error instanceof Error ? error.message : "Failed to parse entry",
    });
  }
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
