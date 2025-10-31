export interface Bookmark {
  readonly bookmarkId: string;
  readonly url: string;
  readonly title: string;
  readonly description: string;
  readonly time: number;
}

export interface Paper {
  readonly arxivId: string;
  readonly title: string;
  readonly authors: readonly string[];
  readonly abstract: string;
  readonly publishedDate: Date;
  readonly pdfUrl: string;
  readonly categories: readonly string[];
  readonly primaryCategory: string;
}

export interface NoteFrontmatter {
  readonly title: string;
  readonly authors: string;
  readonly arxiv_id: string;
  readonly pdf_link: string;
  readonly date_added: string;
  readonly tags: readonly string[];
}

export interface PaperNote {
  readonly paper: Paper;
  readonly filePath: string;
  readonly frontmatter: NoteFrontmatter;
  readonly content: string;
}

export interface SyncStats {
  readonly successful: number;
  readonly skipped: number;
  readonly failed: number;
}
