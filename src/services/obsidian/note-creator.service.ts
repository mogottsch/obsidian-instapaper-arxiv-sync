import { Result, ok } from "../../utils/result";
import { ObsidianError } from "../../types/errors";
import { Paper, NoteFrontmatter } from "../../types/common";
import { VaultService } from "./vault.service";
import { createFilenameFromTitle } from "../../utils/string.utils";
import { getCurrentDate } from "../../utils/date.utils";
import { FILES } from "../../core/constants";

export class NoteCreatorService {
  constructor(
    private readonly vaultService: VaultService,
    private readonly papersFolder: string
  ) {}

  async createNote(
    paper: Paper
  ): Promise<Result<{ filepath: string; created: boolean }, ObsidianError>> {
    const folderResult = await this.vaultService.ensureFolderExists(this.papersFolder);
    if (!folderResult.success) {
      return folderResult;
    }

    const filename = createFilenameFromTitle(paper.title);
    const filepath = `${this.papersFolder}/${filename}${FILES.NOTE_EXTENSION}`;

    if (this.vaultService.fileExists(filepath)) {
      return ok({ filepath, created: false });
    }

    const frontmatter = this.createFrontmatter(paper);

    const content = this.createNoteContent(paper, frontmatter);

    const createResult = await this.vaultService.createFile(filepath, content);
    if (!createResult.success) {
      return createResult;
    }

    return ok({ filepath, created: true });
  }

  private createFrontmatter(paper: Paper): NoteFrontmatter {
    const categoryTags = paper.categories
      .flatMap((cat) =>
        cat
          .split(";")
          .map((part) => part.trim())
          .filter((part) => part.length > 0)
      )
      .map((cat) => cat.toLowerCase().replace(/\./g, "-"));
    const tags = ["paper", "arxiv", ...categoryTags];

    return {
      title: paper.title,
      authors: paper.authors.join(", "),
      arxiv_id: paper.arxivId,
      pdf_link: paper.pdfUrl,
      date_added: getCurrentDate(),
      tags,
    };
  }

  private createNoteContent(paper: Paper, frontmatter: NoteFrontmatter): string {
    const yaml = this.generateYamlFrontmatter(frontmatter);
    const body = this.generateNoteBody(paper);

    return `${yaml}\n${body}`;
  }

  private generateYamlFrontmatter(frontmatter: NoteFrontmatter): string {
    const tags = frontmatter.tags.map((tag) => `  - ${tag}`).join("\n");

    return `---
title: ${this.escapeYaml(frontmatter.title)}
authors: ${this.escapeYaml(frontmatter.authors)}
arxiv_id: ${frontmatter.arxiv_id}
pdf_link: ${frontmatter.pdf_link}
date_added: ${frontmatter.date_added}
tags:
${tags}
---`;
  }

  private escapeYaml(value: string): string {
    if (value.includes(":") || value.includes("#") || value.includes("[")) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }

  private generateNoteBody(paper: Paper): string {
    const arxivUrl = `https://arxiv.org/abs/${paper.arxivId}`;

    return `
# ${paper.title}

[ArXiv](${arxivUrl}) | [PDF](${paper.pdfUrl})

## Abstract

${paper.abstract}

## Notes

`;
  }
}
