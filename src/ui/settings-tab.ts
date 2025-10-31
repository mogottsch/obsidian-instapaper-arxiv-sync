import { App, PluginSettingTab, Setting } from "obsidian";
import { PluginSettings } from "../types/config";
import { showAuthSuccessNotice, showAuthErrorNotice } from "./notice.helper";

export interface SettingsTabPlugin {
  settings: PluginSettings;
  saveSettings(): Promise<void>;
  testConnection(): Promise<boolean>;
}

export class InstapaperSyncSettingsTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: SettingsTabPlugin
  ) {
    super(app, plugin as never);
  }

  private addTestConnectionButton(containerEl: HTMLElement): void {
    new Setting(containerEl).setName("Test connection").addButton((button) =>
      button
        .setButtonText("Test")
        .setCta()
        .onClick(async () => {
          button.setDisabled(true);
          button.setButtonText("Testing...");

          const success = await this.plugin.testConnection();

          if (success) {
            showAuthSuccessNotice();
          } else {
            showAuthErrorNotice();
          }

          button.setDisabled(false);
          button.setButtonText("Test");
        })
    );
  }

  private addOAuthFields(containerEl: HTMLElement): void {
    containerEl.createEl("p", {
      text: "To use this plugin, you need to get OAuth consumer credentials from Instapaper. Fill out the form at https://www.instapaper.com/main/request_oauth_consumer_token to get your consumer key and secret.",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("OAuth consumer key")
      .setDesc("Your Instapaper OAuth consumer key")
      .addText((text) =>
        text
          .setPlaceholder("Enter consumer key")
          .setValue(this.plugin.settings.oauthConsumerKey)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              oauthConsumerKey: value,
            };
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("OAuth consumer secret")
      .setDesc("Your Instapaper OAuth consumer secret")
      .addText((text) => {
        text
          .setPlaceholder("Enter consumer secret")
          .setValue(this.plugin.settings.oauthConsumerSecret)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              oauthConsumerSecret: value,
            };
            await this.plugin.saveSettings();
          });
        text.inputEl.type = "password";
        return text;
      });
  }

  private addUserCredentials(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("Username")
      .setDesc("Your Instapaper username (email)")
      .addText((text) =>
        text
          .setPlaceholder("email@example.com")
          .setValue(this.plugin.settings.instapaperUsername)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              instapaperUsername: value,
            };
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Password")
      .setDesc("Your Instapaper password (if you have one)")
      .addText((text) => {
        text
          .setPlaceholder("password")
          .setValue(this.plugin.settings.instapaperPassword)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              instapaperPassword: value,
            };
            await this.plugin.saveSettings();
          });
        text.inputEl.type = "password";
        return text;
      });
  }

  private displayInstapaperCredentials(containerEl: HTMLElement): void {
    new Setting(containerEl).setHeading().setName("Instapaper credentials");

    this.addOAuthFields(containerEl);
    this.addUserCredentials(containerEl);
    this.addTestConnectionButton(containerEl);
  }

  private displayVaultConfiguration(containerEl: HTMLElement): void {
    new Setting(containerEl).setHeading().setName("Vault configuration");

    new Setting(containerEl)
      .setName("Papers folder")
      .setDesc("Folder where paper notes will be created")
      .addText((text) =>
        text
          .setPlaceholder("Papers")
          .setValue(this.plugin.settings.papersFolder)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              papersFolder: value || "Papers",
            };
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Reading list filename")
      .setDesc("Name of the reading list file")
      .addText((text) =>
        text
          .setPlaceholder("Reading List.md")
          .setValue(this.plugin.settings.readingListFilename)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              readingListFilename: value || "Reading List.md",
            };
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Archive in Instapaper")
      .setDesc("Automatically archive papers in Instapaper after syncing")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.archiveInInstapaper).onChange(async (value) => {
          this.plugin.settings = {
            ...this.plugin.settings,
            archiveInInstapaper: value,
          };
          await this.plugin.saveSettings();
        })
      );
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.displayInstapaperCredentials(containerEl);
    this.displayVaultConfiguration(containerEl);
  }
}
