import { Bookmark } from "../../types/common";

export type { Bookmark };

export interface InstapaperBookmarkResponse {
  readonly bookmark_id: number;
  readonly url: string;
  readonly title: string;
  readonly description: string;
  readonly time: number;
}

export interface InstapaperListResponse {
  readonly user?: {
    readonly user_id: number;
    readonly username: string;
  };
  readonly bookmarks?: InstapaperBookmarkResponse[];
  readonly highlights?: unknown[];
  readonly delete_ids?: number[];
}
