import { Result, ok, err, andThen } from "../../utils/result";
import { ArxivError } from "../../types/errors";
import { Paper } from "../../types/common";
import { ArxivClient } from "./arxiv.client";
import { parseArxivXml } from "./arxiv.xml-parser";
import { ArxivFeedEntry } from "./arxiv.types";

export class ArxivService {
  constructor(private readonly client: ArxivClient) {}

  async fetchPapers(ids: readonly string[]): Promise<Result<Paper[], ArxivError>> {
    if (ids.length === 0) {
      return ok([]);
    }

    const xmlResult = await this.client.fetchByIds(ids);
    if (!xmlResult.success) {
      return xmlResult;
    }

    const entriesResult = parseArxivXml(xmlResult.value);
    if (!entriesResult.success) {
      return entriesResult;
    }

    const papers = entriesResult.value.map((entry) => this.feedEntryToPaper(entry));

    return ok(papers);
  }

  async fetchPaper(id: string): Promise<Result<Paper, ArxivError>> {
    const result = await this.fetchPapers([id]);
    return andThen(result, (papers) => {
      const firstPaper = papers[0];
      if (!firstPaper) {
        return err({ type: "NOT_FOUND", arxivId: id });
      }
      return ok(firstPaper);
    });
  }

  private feedEntryToPaper(entry: ArxivFeedEntry): Paper {
    return {
      arxivId: entry.id,
      title: entry.title,
      authors: entry.authors,
      abstract: entry.summary,
      publishedDate: new Date(entry.published),
      pdfUrl: entry.pdfLink,
      categories: entry.categories,
      primaryCategory: entry.primaryCategory,
    };
  }
}
