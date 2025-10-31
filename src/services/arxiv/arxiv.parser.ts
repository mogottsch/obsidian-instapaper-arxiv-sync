import { Result, ok, err } from "../../utils/result";
import { ArxivError } from "../../types/errors";
import { isValidArxivId, isValidUrl } from "../../utils/validation";

export function extractIdFromUrl(url: string): Result<string, ArxivError> {
  if (!isValidUrl(url)) {
    return err({ type: "INVALID_URL", url });
  }

  const regex = /arxiv\.org\/(abs|pdf)\/(\d{4}\.\d{4,5})(v\d+)?/;
  const match = regex.exec(url);

  const arxivId = match?.[2] ?? "";
  if (arxivId.length === 0) {
    return err({ type: "INVALID_URL", url });
  }

  if (!isValidArxivId(arxivId)) {
    return err({ type: "INVALID_ID", arxivId });
  }

  return ok(arxivId);
}

export function extractIdsFromUrls(urls: readonly string[]): readonly string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const url of urls) {
    const result = extractIdFromUrl(url);
    if (result.success && !seen.has(result.value)) {
      ids.push(result.value);
      seen.add(result.value);
    }
  }

  return ids;
}

export function isArxivUrl(url: string): boolean {
  return url.includes("arxiv.org/abs/") || url.includes("arxiv.org/pdf/");
}
