import { describe, it, expect } from "vitest";
import {
  sanitizeFilename,
  createFilenameFromTitle,
  escapeMarkdown,
  createWikilinkTitle,
} from "./string.utils";

describe("StringUtils", () => {
  describe("sanitizeFilename", () => {
    it("should remove invalid characters", () => {
      const input = 'File/Name\\With:Invalid*Characters?"<>|';
      const result = sanitizeFilename(input);

      expect(result).toBe("FileNameWithInvalidCharacters");
    });

    it("should replace multiple spaces with single space", () => {
      const input = "Multiple    Spaces   Here";
      const result = sanitizeFilename(input);

      expect(result).toBe("Multiple Spaces Here");
    });

    it("should trim leading and trailing spaces", () => {
      const input = "   Leading and Trailing   ";
      const result = sanitizeFilename(input);

      expect(result).toBe("Leading and Trailing");
    });

    it("should limit length", () => {
      const input = "A".repeat(250);
      const result = sanitizeFilename(input, 100);

      expect(result.length).toBe(100);
    });

    it("should handle already valid filenames", () => {
      const input = "Valid Filename";
      const result = sanitizeFilename(input);

      expect(result).toBe("Valid Filename");
    });

    it("should handle empty string", () => {
      const input = "";
      const result = sanitizeFilename(input);

      expect(result).toBe("");
    });
  });

  describe("createFilenameFromTitle", () => {
    it("should create valid filename from title", () => {
      const title = "Attention Is All You Need";
      const result = createFilenameFromTitle(title);

      expect(result).toBe("Attention Is All You Need");
    });

    it("should handle titles with special characters", () => {
      const title = "BERT: Pre-training of Deep Bidirectional Transformers";
      const result = createFilenameFromTitle(title);

      expect(result).toBe("BERT Pre-training of Deep Bidirectional Transformers");
    });

    it("should return default for empty title", () => {
      const title = "";
      const result = createFilenameFromTitle(title);

      expect(result).toBe("Untitled Paper");
    });

    it("should return default for invalid characters only", () => {
      const title = "///:::***";
      const result = createFilenameFromTitle(title);

      expect(result).toBe("Untitled Paper");
    });
  });

  describe("escapeMarkdown", () => {
    it("should escape special markdown characters", () => {
      const input = "Text with *bold* and _italic_ and [links]";
      const result = escapeMarkdown(input);

      expect(result).toBe("Text with \\*bold\\* and \\_italic\\_ and \\[links\\]");
    });

    it("should handle text without special characters", () => {
      const input = "Plain text";
      const result = escapeMarkdown(input);

      expect(result).toBe("Plain text");
    });
  });

  describe("createWikilinkTitle", () => {
    it("should replace invalid wikilink characters", () => {
      const input = "Title [with] invalid|characters#and^more";
      const result = createWikilinkTitle(input);

      expect(result).toBe("Title -with- invalid-characters-and-more");
    });

    it("should handle valid titles", () => {
      const input = "Valid Title";
      const result = createWikilinkTitle(input);

      expect(result).toBe("Valid Title");
    });

    it("should trim whitespace", () => {
      const input = "  Title with spaces  ";
      const result = createWikilinkTitle(input);

      expect(result).toBe("Title with spaces");
    });
  });
});
