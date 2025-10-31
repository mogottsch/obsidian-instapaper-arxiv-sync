import { Notice } from "obsidian";
import { SyncStats } from "../types/common";
import { SyncError, InstapaperError, ArxivError, ObsidianError } from "../types/errors";

export function showSyncSuccessNotice(stats: SyncStats): void {
  const { successful, skipped, failed } = stats;
  const successfulStr = successful.toString();
  const skippedStr = skipped.toString();
  const failedStr = failed.toString();

  if (failed === 0) {
    if (successful === 0) {
      new Notice("No new ArXiv papers found");
    } else if (skipped === 0) {
      new Notice(
        `✓ Sync complete! Created ${successfulStr} new paper${successful === 1 ? "" : "s"}`
      );
    } else {
      new Notice(
        `✓ Sync complete! Created ${successfulStr} new paper${successful === 1 ? "" : "s"}, ` +
          `skipped ${skippedStr} duplicate${skipped === 1 ? "" : "s"}`
      );
    }
  } else {
    new Notice(
      `⚠ Sync completed with issues: Created ${successfulStr}, failed ${failedStr}`,
      5000
    );
  }
}

function getErrorMessage(innerError: InstapaperError | ArxivError | ObsidianError): string {
  if (innerError.type === "AUTH_FAILED") {
    return "Invalid Instapaper credentials. Please check your settings.";
  } else if (innerError.type === "NETWORK_ERROR") {
    return "Network error. Please check your connection.";
  } else if (innerError.type === "RATE_LIMITED") {
    return `Rate limited. Please try again in ${innerError.retryAfter.toString()} seconds.`;
  } else if ("message" in innerError) {
    return innerError.message;
  } else {
    return "Unknown error";
  }
}

export function showSyncErrorNotice(error: SyncError): void {
  if (error.type === "PARTIAL_FAILURE") {
    const successfulStr = error.successful.toString();
    const failedStr = error.failed.toString();
    const message = `Partial sync failure: ${successfulStr} succeeded, ${failedStr} failed`;
    new Notice(message, 7000);
  } else {
    const message = `Sync failed: ${getErrorMessage(error.error)}`;
    new Notice(message, 7000);
  }
}

export function showAuthSuccessNotice(): void {
  new Notice("✓ Connected to Instapaper successfully");
}

export function showAuthErrorNotice(): void {
  new Notice("✗ Authentication failed. Please check your credentials.", 5000);
}
