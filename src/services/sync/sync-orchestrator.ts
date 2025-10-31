import { Result, ok, err } from "../../utils/result";
import { SyncError, InstapaperError, ArxivError, ObsidianError } from "../../types/errors";
import { SyncStats, Paper } from "../../types/common";
import { InstapaperService } from "../instapaper/instapaper.service";
import { ArxivService } from "../arxiv/arxiv.service";
import { NoteCreatorService } from "../obsidian/note-creator.service";
import { ReadingListService } from "../obsidian/reading-list.service";
import { extractIdsFromUrls, isArxivUrl } from "../arxiv/arxiv.parser";
import { SyncState } from "./sync-state";

export interface SyncOrchestratorConfig {
  readonly archiveInInstapaper: boolean;
}

export class SyncOrchestrator {
  private readonly state: SyncState;

  constructor(
    private readonly instapaperService: InstapaperService,
    private readonly arxivService: ArxivService,
    private readonly noteCreatorService: NoteCreatorService,
    private readonly readingListService: ReadingListService,
    private readonly config: SyncOrchestratorConfig
  ) {
    this.state = new SyncState();
  }

  private async fetchBookmarks(): Promise<
    Result<readonly { readonly bookmarkId: string; readonly url: string }[], SyncError>
  > {
    const bookmarksResult = await this.instapaperService.fetchBookmarks();
    if (!bookmarksResult.success) {
      return err({
        type: "COMPLETE_FAILURE",
        error: bookmarksResult.error,
      });
    }
    return ok(bookmarksResult.value);
  }

  private extractArxivIds(
    bookmarks: readonly { readonly bookmarkId: string; readonly url: string }[]
  ): readonly string[] {
    const arxivUrls = bookmarks.filter((b) => isArxivUrl(b.url)).map((b) => b.url);
    return extractIdsFromUrls(arxivUrls);
  }

  private async fetchPapers(arxivIds: readonly string[]): Promise<Result<Paper[], SyncError>> {
    const papersResult = await this.arxivService.fetchPapers(arxivIds);
    if (!papersResult.success) {
      return err({
        type: "COMPLETE_FAILURE",
        error: papersResult.error,
      });
    }
    return ok(papersResult.value);
  }

  private async processPapers(papers: Paper[]): Promise<{
    successfulPapers: Paper[];
    errors: (InstapaperError | ArxivError | ObsidianError)[];
  }> {
    const errors: (InstapaperError | ArxivError | ObsidianError)[] = [];
    const successfulPapers: Paper[] = [];

    for (const paper of papers) {
      const noteResult = await this.noteCreatorService.createNote(paper);

      if (noteResult.success) {
        if (noteResult.value.created) {
          this.state.incrementSuccessful();
        } else {
          this.state.incrementSkipped();
        }
        successfulPapers.push(paper);
      } else {
        this.state.incrementFailed();
        errors.push(noteResult.error);
      }
    }

    return { successfulPapers, errors };
  }

  private async updateReadingList(
    successfulPapers: Paper[]
  ): Promise<(InstapaperError | ArxivError | ObsidianError)[]> {
    const errors: (InstapaperError | ArxivError | ObsidianError)[] = [];
    if (successfulPapers.length > 0) {
      const readingListResult = await this.readingListService.addPapers(successfulPapers);
      if (!readingListResult.success) {
        errors.push(readingListResult.error);
      }
    }
    return errors;
  }

  async sync(): Promise<Result<SyncStats, SyncError>> {
    this.state.reset();

    const bookmarksResult = await this.fetchBookmarks();
    if (!bookmarksResult.success) {
      return bookmarksResult;
    }

    const arxivIds = this.extractArxivIds(bookmarksResult.value);
    if (arxivIds.length === 0) {
      return ok(this.state.getStats());
    }

    const papersResult = await this.fetchPapers(arxivIds);
    if (!papersResult.success) {
      return papersResult;
    }

    const { successfulPapers, errors } = await this.processPapers(papersResult.value);
    const readingListErrors = await this.updateReadingList(successfulPapers);
    errors.push(...readingListErrors);

    if (this.config.archiveInInstapaper && successfulPapers.length > 0) {
      this.archiveBookmarks(bookmarksResult.value, arxivIds);
    }

    const stats = this.state.getStats();

    if (errors.length > 0) {
      return err({
        type: "PARTIAL_FAILURE",
        successful: stats.successful,
        failed: stats.failed,
        errors,
      });
    }

    return ok(stats);
  }

  private archiveBookmarks(
    bookmarks: readonly { readonly bookmarkId: string; readonly url: string }[],
    arxivIds: readonly string[]
  ): void {
    const idSet = new Set(arxivIds);

    for (const bookmark of bookmarks) {
      if (!isArxivUrl(bookmark.url)) {
        continue;
      }

      const ids = extractIdsFromUrls([bookmark.url]);
      const firstId = ids[0] ?? "";
      if (firstId.length > 0 && idSet.has(firstId)) {
        void this.instapaperService.archiveBookmark(bookmark.bookmarkId);
      }
    }
  }
}
