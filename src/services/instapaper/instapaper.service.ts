import { Result, ok, err } from "../../utils/result";
import { InstapaperError } from "../../types/errors";
import { Bookmark } from "../../types/common";
import { InstapaperClient } from "./instapaper.client";
import { InstapaperBookmarkResponse } from "./instapaper.types";

export class InstapaperService {
  constructor(private readonly client: InstapaperClient) {}

  async authenticate(): Promise<Result<void, InstapaperError>> {
    const result = await this.client.verifyCredentials();
    if (result.success) {
      return ok(undefined);
    }
    return err(result.error);
  }

  async fetchBookmarks(): Promise<Result<Bookmark[], InstapaperError>> {
    const result = await this.client.fetchBookmarks();

    if (!result.success) {
      return err(result.error);
    }

    try {
      const rawData: unknown = JSON.parse(result.value);

      let bookmarksArray: InstapaperBookmarkResponse[] = [];

      if (Array.isArray(rawData)) {
        bookmarksArray = rawData.filter(
          (item): item is InstapaperBookmarkResponse =>
            item !== null &&
            typeof item === "object" &&
            "type" in item &&
            typeof (item as Record<string, unknown>).type === "string" &&
            (item as Record<string, unknown>).type === "bookmark" &&
            "bookmark_id" in item &&
            "url" in item
        );
      } else if (
        rawData !== null &&
        typeof rawData === "object" &&
        "bookmarks" in rawData &&
        Array.isArray(rawData.bookmarks)
      ) {
        bookmarksArray = rawData.bookmarks as InstapaperBookmarkResponse[];
      } else {
        return ok([]);
      }

      const bookmarks = bookmarksArray.map((b) => this.parseBookmark(b));

      return ok(bookmarks);
    } catch (error) {
      return err({
        type: "INVALID_RESPONSE",
        message:
          error instanceof Error
            ? `Failed to parse response: ${error.message}`
            : "Failed to parse response",
      });
    }
  }

  async archiveBookmark(bookmarkId: string): Promise<Result<void, InstapaperError>> {
    return this.client.archiveBookmark(bookmarkId);
  }

  private parseBookmark(response: InstapaperBookmarkResponse): Bookmark {
    return {
      bookmarkId: String(response.bookmark_id),
      url: response.url,
      title: response.title,
      description: response.description || "",
      time: response.time,
    };
  }
}
