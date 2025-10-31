import { Vault, TFolder, TFile, normalizePath } from "obsidian";
import { Result, ok, err } from "../../utils/result";
import { ObsidianError } from "../../types/errors";

export class VaultService {
  constructor(private readonly vault: Vault) {}

  async ensureFolderExists(path: string): Promise<Result<void, ObsidianError>> {
    const normalizedPath = normalizePath(path);

    try {
      const folder = this.vault.getAbstractFileByPath(normalizedPath);
      if (folder instanceof TFolder) {
        return ok(undefined);
      }

      await this.vault.createFolder(normalizedPath);
      return ok(undefined);
    } catch {
      const folder = this.vault.getAbstractFileByPath(normalizedPath);
      if (folder instanceof TFolder) {
        return ok(undefined);
      }

      return err({
        type: "FOLDER_CREATE_FAILED",
        path: normalizedPath,
      });
    }
  }

  fileExists(path: string): boolean {
    const normalizedPath = normalizePath(path);
    const file = this.vault.getAbstractFileByPath(normalizedPath);
    return file instanceof TFile;
  }

  async createFile(path: string, content: string): Promise<Result<void, ObsidianError>> {
    const normalizedPath = normalizePath(path);

    try {
      await this.vault.create(normalizedPath, content);
      return ok(undefined);
    } catch (error) {
      return err({
        type: "FILE_WRITE_FAILED",
        path: normalizedPath,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async readFile(path: string): Promise<Result<string, ObsidianError>> {
    const normalizedPath = normalizePath(path);

    try {
      const file = this.vault.getAbstractFileByPath(normalizedPath);
      if (!(file instanceof TFile)) {
        return err({
          type: "FILE_READ_FAILED",
          path: normalizedPath,
          message: "File not found",
        });
      }

      const content = await this.vault.read(file);
      return ok(content);
    } catch (error) {
      return err({
        type: "FILE_READ_FAILED",
        path: normalizedPath,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async modifyFile(path: string, content: string): Promise<Result<void, ObsidianError>> {
    const normalizedPath = normalizePath(path);

    try {
      const file = this.vault.getAbstractFileByPath(normalizedPath);
      if (!(file instanceof TFile)) {
        return err({
          type: "FILE_WRITE_FAILED",
          path: normalizedPath,
          message: "File not found",
        });
      }

      await this.vault.modify(file, content);
      return ok(undefined);
    } catch (error) {
      return err({
        type: "FILE_WRITE_FAILED",
        path: normalizedPath,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
