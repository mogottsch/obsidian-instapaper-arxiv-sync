import { Result, ok } from "../../utils/result";
import { ObsidianError } from "../../types/errors";
import { Paper } from "../../types/common";
import { VaultService } from "./vault.service";
import { createFilenameFromTitle } from "../../utils/string.utils";
import { getCurrentDateTime, formatDate } from "../../utils/date.utils";

export class ReadingListService {
  constructor(
    private readonly vaultService: VaultService,
    private readonly papersFolder: string,
    private readonly readingListFilename: string
  ) {}

  async addPapers(papers: readonly Paper[]): Promise<Result<void, ObsidianError>> {
    if (papers.length === 0) {
      return ok(undefined);
    }

    const folderResult = await this.vaultService.ensureFolderExists(this.papersFolder);
    if (!folderResult.success) {
      return folderResult;
    }

    const filepath = `${this.papersFolder}/${this.readingListFilename}`;

    const existingResult = await this.vaultService.readFile(filepath);
    let content: string;

    if (existingResult.success) {
      content = this.updateReadingList(existingResult.value, papers);
      return this.vaultService.modifyFile(filepath, content);
    } else {
      content = this.createReadingList(papers);
      return this.vaultService.createFile(filepath, content);
    }
  }

  private createReadingList(papers: readonly Paper[]): string {
    const header = this.createHeader();
    const table = this.createTable(papers);

    return `${header}\n\n${table}`;
  }

  private updateReadingList(existing: string, papers: readonly Paper[]): string {
    const existingArxivIds = this.extractExistingArxivIds(existing);
    const newPapers = papers.filter((paper) => !existingArxivIds.has(paper.arxivId));

    if (newPapers.length === 0) {
      const lastUpdatedRegex = /Last updated: .*/;
      return existing.replace(lastUpdatedRegex, `Last updated: ${getCurrentDateTime()}`);
    }

    const lastUpdatedRegex = /Last updated: .*/;
    const updatedHeader = existing.replace(
      lastUpdatedRegex,
      `Last updated: ${getCurrentDateTime()}`
    );

    const newRows = newPapers.map((paper) => this.createTableRow(paper)).join("\n");

    const tableHeaderRegex = /\|\s*Paper\s*\|.*\|\s*\n\|\s*-+\s*\|.*\|\s*\n/;
    const match = tableHeaderRegex.exec(updatedHeader);

    if (match?.index !== undefined) {
      const insertPosition = match.index + match[0].length;
      return (
        updatedHeader.slice(0, insertPosition) +
        newRows +
        "\n" +
        updatedHeader.slice(insertPosition)
      );
    }

    return `${updatedHeader}\n${newRows}`;
  }

  private extractExistingArxivIds(content: string): Set<string> {
    const arxivIds = new Set<string>();
    const arxivLinkRegex =
      /\[(\d{4}\.\d{4,5}(?:v\d+)?)\]\(https:\/\/arxiv\.org\/abs\/\d{4}\.\d{4,5}(?:v\d+)?\)/g;

    let match;
    while ((match = arxivLinkRegex.exec(content)) !== null) {
      const arxivId = match[1];
      if (arxivId !== undefined && arxivId.length > 0) {
        const idWithoutVersion = arxivId.replace(/v\d+$/, "");
        arxivIds.add(idWithoutVersion);
      }
    }

    return arxivIds;
  }

  private createHeader(): string {
    return `# Reading List

Last updated: ${getCurrentDateTime()}`;
  }

  private createTable(papers: readonly Paper[]): string {
    const header = `| Paper | ArXiv | Read | Added |
| --- | --- | --- | --- |`;

    const rows = papers.map((paper) => this.createTableRow(paper)).join("\n");

    return `${header}\n${rows}`;
  }

  private createTableRow(paper: Paper): string {
    const filename = createFilenameFromTitle(paper.title);
    const arxivUrl = `https://arxiv.org/abs/${paper.arxivId}`;
    const dateAdded = formatDate(new Date());

    return `| [[${filename}]] | [${paper.arxivId}](${arxivUrl}) | [ ] | ${dateAdded} |`;
  }
}
