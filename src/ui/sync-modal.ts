import { Modal } from "obsidian";

export class SyncModal extends Modal {
  private statusEl: HTMLElement | null = null;
  private progressEl: HTMLElement | null = null;

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Syncing Instapaper Papers" });

    this.statusEl = contentEl.createDiv({ cls: "sync-status" });
    this.statusEl.setText("Initializing...");

    this.progressEl = contentEl.createDiv({ cls: "sync-progress" });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.statusEl = null;
    this.progressEl = null;
  }

  setStatus(message: string): void {
    if (this.statusEl) {
      this.statusEl.setText(message);
    }
  }

  setProgress(current: number, total: number): void {
    if (this.progressEl) {
      const currentStr = current.toString();
      const totalStr = total.toString();
      this.progressEl.setText(`Processing ${currentStr} of ${totalStr}...`);
    }
  }
}
