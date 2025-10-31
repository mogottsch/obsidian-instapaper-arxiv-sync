import { SyncStats } from "../../types/common";

export class SyncState {
  private _successful = 0;
  private _skipped = 0;
  private _failed = 0;

  incrementSuccessful(): void {
    this._successful++;
  }

  incrementSkipped(): void {
    this._skipped++;
  }

  incrementFailed(): void {
    this._failed++;
  }

  getStats(): SyncStats {
    return {
      successful: this._successful,
      skipped: this._skipped,
      failed: this._failed,
    };
  }

  reset(): void {
    this._successful = 0;
    this._skipped = 0;
    this._failed = 0;
  }
}
