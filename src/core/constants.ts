export const INSTAPAPER_API = {
  BASE_URL: "https://www.instapaper.com",
  ENDPOINTS: {
    ACCESS_TOKEN: "/api/1/oauth/access_token",
    LIST: "/api/1/bookmarks/list",
    ARCHIVE: "/api/1/bookmarks/archive",
    VERIFY: "/api/1/account/verify_credentials",
  },
} as const;

export const ARXIV_API = {
  BASE_URL: "https://export.arxiv.org/api/query",
  RATE_LIMIT_SECONDS: 3,
  MAX_RESULTS_PER_REQUEST: 100,
} as const;

export const UI = {
  RIBBON_ICON: "sync",
  RIBBON_TITLE: "Sync Instapaper ArXiv Papers",
} as const;

export const FILES = {
  MAX_FILENAME_LENGTH: 200,
  NOTE_EXTENSION: ".md",
} as const;

export const COMMANDS = {
  SYNC: {
    id: "sync-instapaper-arxiv",
    name: "Sync Instapaper ArXiv Papers",
  },
} as const;
