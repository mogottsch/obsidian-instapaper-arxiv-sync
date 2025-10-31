import { requestUrl } from "obsidian";
import { Result, ok, err } from "../../utils/result";
import { ArxivError } from "../../types/errors";
import { ARXIV_API } from "../../core/constants";

class RateLimiter {
  private lastRequest = 0;
  private readonly minInterval: number;

  constructor(requestsPerSecond: number) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequest;

    if (elapsed < this.minInterval) {
      await this.sleep(this.minInterval - elapsed);
    }

    this.lastRequest = Date.now();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class ArxivClient {
  private readonly rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter(1 / ARXIV_API.RATE_LIMIT_SECONDS);
  }

  async fetchByIds(ids: readonly string[]): Promise<Result<string, ArxivError>> {
    if (ids.length === 0) {
      return ok("");
    }

    await this.rateLimiter.throttle();

    try {
      const idList = ids.join(",");
      const maxResults = ARXIV_API.MAX_RESULTS_PER_REQUEST.toString();
      const url = `${ARXIV_API.BASE_URL}?id_list=${idList}&max_results=${maxResults}`;

      const response = await requestUrl({
        url,
        method: "GET",
      });

      if (response.status === 200) {
        return ok(response.text);
      } else {
        return err({
          type: "NETWORK_ERROR",
          message: `ArXiv API returned status ${response.status.toString()}`,
        });
      }
    } catch (error) {
      return err({
        type: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown network error",
      });
    }
  }
}
