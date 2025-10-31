import { Result, err } from "./result";

export interface RetryOptions {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T, E>(
  operation: () => Promise<Result<T, E>>,
  options: Partial<RetryOptions> = {}
): Promise<Result<T, E>> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: E | undefined;
  let delayMs = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    const result = await operation();

    if (result.success) {
      return result;
    }

    lastError = result.error;

    if (attempt < opts.maxAttempts) {
      await sleep(delayMs);
      delayMs = Math.min(delayMs * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  return err(lastError as E);
}
