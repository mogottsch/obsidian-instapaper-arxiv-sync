import { Vault, TFolder, TFile } from "obsidian";
import { Result, ok, err } from "../../utils/result";
import { ObsidianError } from "../../types/errors";
import { isSafePath } from "../../utils/validation";

export class VaultService {
  constructor(private readonly vault: Vault) {}

  async ensureFolderExists(path: string): Promise<Result<void, ObsidianError>> {
    if (!isSafePath(path)) {
      return err({ type: "INVALID_PATH", path });
    }

    try {
      const folder = this.vault.getAbstractFileByPath(path);
      if (folder instanceof TFolder) {
        return ok(undefined);
      }

      await this.vault.createFolder(path);
      return ok(undefined);
    } catch {
      const folder = this.vault.getAbstractFileByPath(path);
      if (folder instanceof TFolder) {
        return ok(undefined);
      }

      return err({
        type: "FOLDER_CREATE_FAILED",
        path,
      });
    }
  }

  fileExists(path: string): boolean {
    const file = this.vault.getAbstractFileByPath(path);
    return file instanceof TFile;
  }

  async createFile(path: string, content: string): Promise<Result<void, ObsidianError>> {
    if (!isSafePath(path)) {
      return err({ type: "INVALID_PATH", path });
    }

    try {
      await this.vault.create(path, content);
      return ok(undefined);
    } catch (error) {
      return err({
        type: "FILE_WRITE_FAILED",
        path,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async readFile(path: string): Promise<Result<string, ObsidianError>> {
    if (!isSafePath(path)) {
      return err({ type: "INVALID_PATH", path });
    }

    try {
      const file = this.vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) {
        return err({
          type: "FILE_READ_FAILED",
          path,
          message: "File not found",
        });
      }

      const content = await this.vault.read(file);
      return ok(content);
    } catch (error) {
      return err({
        type: "FILE_READ_FAILED",
        path,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async modifyFile(path: string, content: string): Promise<Result<void, ObsidianError>> {
    if (!isSafePath(path)) {
      return err({ type: "INVALID_PATH", path });
    }

    try {
      const file = this.vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) {
        return err({
          type: "FILE_WRITE_FAILED",
          path,
          message: "File not found",
        });
      }

      await this.vault.modify(file, content);
      return ok(undefined);
    } catch (error) {
      return err({
        type: "FILE_WRITE_FAILED",
        path,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
