export type InstapaperError =
  | { readonly type: "AUTH_FAILED"; readonly message: string }
  | { readonly type: "NETWORK_ERROR"; readonly message: string }
  | { readonly type: "RATE_LIMITED"; readonly retryAfter: number }
  | { readonly type: "INVALID_RESPONSE"; readonly message: string }
  | { readonly type: "UNKNOWN_ERROR"; readonly message: string };

export type ArxivError =
  | { readonly type: "INVALID_ID"; readonly arxivId: string }
  | { readonly type: "INVALID_URL"; readonly url: string }
  | { readonly type: "NOT_FOUND"; readonly arxivId: string }
  | { readonly type: "NETWORK_ERROR"; readonly message: string }
  | { readonly type: "RATE_LIMITED"; readonly retryAfter: number }
  | { readonly type: "PARSE_ERROR"; readonly message: string }
  | { readonly type: "UNKNOWN_ERROR"; readonly message: string };

export type ObsidianError =
  | { readonly type: "FOLDER_CREATE_FAILED"; readonly path: string }
  | {
      readonly type: "FILE_WRITE_FAILED";
      readonly path: string;
      readonly message: string;
    }
  | {
      readonly type: "FILE_READ_FAILED";
      readonly path: string;
      readonly message: string;
    }
  | { readonly type: "INVALID_PATH"; readonly path: string }
  | { readonly type: "UNKNOWN_ERROR"; readonly message: string };

export type SyncError =
  | {
      readonly type: "PARTIAL_FAILURE";
      readonly successful: number;
      readonly failed: number;
      readonly errors: readonly (InstapaperError | ArxivError | ObsidianError)[];
    }
  | {
      readonly type: "COMPLETE_FAILURE";
      readonly error: InstapaperError | ArxivError | ObsidianError;
    };
