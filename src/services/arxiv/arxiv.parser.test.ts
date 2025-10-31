import { describe, it, expect } from "vitest";
import { extractIdFromUrl, extractIdsFromUrls, isArxivUrl } from "./arxiv.parser";

describe("ArxivParser", () => {
  describe("extractIdFromUrl", () => {
    it("should extract ID from abs URL", () => {
      const url = "https://arxiv.org/abs/2301.12345";
      const result = extractIdFromUrl(url);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe("2301.12345");
      }
    });

    it("should extract ID from pdf URL", () => {
      const url = "https://arxiv.org/pdf/2301.12345.pdf";
      const result = extractIdFromUrl(url);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe("2301.12345");
      }
    });

    it("should extract ID from URL with version", () => {
      const url = "https://arxiv.org/abs/2301.12345v2";
      const result = extractIdFromUrl(url);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe("2301.12345");
      }
    });

    it("should handle 4-digit suffix IDs", () => {
      const url = "https://arxiv.org/abs/2301.1234";
      const result = extractIdFromUrl(url);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe("2301.1234");
      }
    });

    it("should return error for invalid URL", () => {
      const url = "https://example.com";
      const result = extractIdFromUrl(url);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_URL");
      }
    });

    it("should return error for non-arxiv URL", () => {
      const url = "https://google.com/search?q=arxiv";
      const result = extractIdFromUrl(url);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("INVALID_URL");
      }
    });

    it("should return error for malformed arxiv URL", () => {
      const url = "https://arxiv.org/invalid/path";
      const result = extractIdFromUrl(url);

      expect(result.success).toBe(false);
    });
  });

  describe("extractIdsFromUrls", () => {
    it("should extract multiple IDs", () => {
      const urls = [
        "https://arxiv.org/abs/2301.12345",
        "https://arxiv.org/abs/2302.67890",
        "https://arxiv.org/pdf/2303.11111.pdf",
      ];

      const ids = extractIdsFromUrls(urls);

      expect(ids).toEqual(["2301.12345", "2302.67890", "2303.11111"]);
    });

    it("should skip invalid URLs", () => {
      const urls = [
        "https://arxiv.org/abs/2301.12345",
        "https://example.com",
        "https://arxiv.org/abs/2302.67890",
      ];

      const ids = extractIdsFromUrls(urls);

      expect(ids).toEqual(["2301.12345", "2302.67890"]);
    });

    it("should deduplicate IDs", () => {
      const urls = [
        "https://arxiv.org/abs/2301.12345",
        "https://arxiv.org/pdf/2301.12345.pdf",
        "https://arxiv.org/abs/2301.12345v2",
      ];

      const ids = extractIdsFromUrls(urls);

      expect(ids).toEqual(["2301.12345"]);
    });

    it("should return empty array for no valid URLs", () => {
      const urls = ["https://example.com", "https://google.com"];

      const ids = extractIdsFromUrls(urls);

      expect(ids).toEqual([]);
    });

    it("should handle empty array", () => {
      const ids = extractIdsFromUrls([]);

      expect(ids).toEqual([]);
    });
  });

  describe("isArxivUrl", () => {
    it("should return true for abs URL", () => {
      expect(isArxivUrl("https://arxiv.org/abs/2301.12345")).toBe(true);
    });

    it("should return true for pdf URL", () => {
      expect(isArxivUrl("https://arxiv.org/pdf/2301.12345.pdf")).toBe(true);
    });

    it("should return false for non-arxiv URL", () => {
      expect(isArxivUrl("https://example.com")).toBe(false);
    });

    it("should return false for arxiv domain without abs or pdf", () => {
      expect(isArxivUrl("https://arxiv.org/list/cs.LG/recent")).toBe(false);
    });
  });
});
