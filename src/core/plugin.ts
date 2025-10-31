import { Plugin } from "obsidian";
import { PluginSettings } from "../types/config";
import { DEFAULT_SETTINGS } from "./settings";
import { UI, COMMANDS } from "./constants";
import { InstapaperSyncSettingsTab } from "../ui/settings-tab";
import { SyncModal } from "../ui/sync-modal";
import { showSyncSuccessNotice, showSyncErrorNotice } from "../ui/notice.helper";
import { InstapaperService } from "../services/instapaper/instapaper.service";
import { InstapaperClient } from "../services/instapaper/instapaper.client";
import { ArxivService } from "../services/arxiv/arxiv.service";
import { ArxivClient } from "../services/arxiv/arxiv.client";
import { VaultService } from "../services/obsidian/vault.service";
import { NoteCreatorService } from "../services/obsidian/note-creator.service";
import { ReadingListService } from "../services/obsidian/reading-list.service";
import { SyncOrchestrator } from "../services/sync/sync-orchestrator";

export class InstapaperArxivSyncPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;
  private syncOrchestrator: SyncOrchestrator | null = null;
  private instapaperService: InstapaperService | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.initializeServices();
    this.registerCommands();
    this.addSettingTab(new InstapaperSyncSettingsTab(this.app, this));
    this.addRibbonIcon(UI.RIBBON_ICON, UI.RIBBON_TITLE, () => {
      void this.sync();
    });
  }

  onunload(): void {
    this.cleanup();
  }

  async loadSettings(): Promise<void> {
    const data = (await this.loadData()) as Partial<PluginSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.initializeServices();
  }

  async testConnection(): Promise<boolean> {
    if (!this.instapaperService) {
      this.initializeServices();
    }

    if (!this.instapaperService) {
      return false;
    }

    const result = await this.instapaperService.authenticate();
    return result.success;
  }

  private initializeServices(): void {
    const instapaperClient = new InstapaperClient(
      this.settings.instapaperUsername,
      this.settings.instapaperPassword,
      this.settings.oauthConsumerKey,
      this.settings.oauthConsumerSecret
    );
    this.instapaperService = new InstapaperService(instapaperClient);

    const arxivClient = new ArxivClient();
    const arxivService = new ArxivService(arxivClient);

    const vaultService = new VaultService(this.app.vault);
    const noteCreatorService = new NoteCreatorService(vaultService, this.settings.papersFolder);
    const readingListService = new ReadingListService(
      vaultService,
      this.settings.papersFolder,
      this.settings.readingListFilename
    );

    this.syncOrchestrator = new SyncOrchestrator(
      this.instapaperService,
      arxivService,
      noteCreatorService,
      readingListService,
      {
        archiveInInstapaper: this.settings.archiveInInstapaper,
      }
    );
  }

  private registerCommands(): void {
    this.addCommand({
      id: COMMANDS.SYNC.id,
      name: COMMANDS.SYNC.name,
      callback: () => {
        void this.sync();
      },
    });
  }

  async sync(): Promise<void> {
    if (!this.syncOrchestrator) {
      return;
    }

    const modal = new SyncModal(this.app);
    modal.open();

    try {
      modal.setStatus("Fetching bookmarks from Instapaper...");

      const result = await this.syncOrchestrator.sync();

      modal.close();

      if (result.success) {
        showSyncSuccessNotice(result.value);
      } else {
        showSyncErrorNotice(result.error);
      }
    } catch (error) {
      modal.close();
      showSyncErrorNotice({
        type: "COMPLETE_FAILURE",
        error: {
          type: "UNKNOWN_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  private cleanup(): void {
    this.syncOrchestrator = null;
    this.instapaperService = null;
  }
}
