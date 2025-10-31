import { Paper } from "../../types/common";

export type { Paper };

export interface ArxivFeedEntry {
  readonly id: string;
  readonly title: string;
  readonly authors: readonly string[];
  readonly summary: string;
  readonly published: string;
  readonly categories: readonly string[];
  readonly primaryCategory: string;
  readonly pdfLink: string;
}
