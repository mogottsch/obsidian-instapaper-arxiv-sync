import { describe, it, expect } from "vitest";
import { isEmptyString, isValidUrl, isValidArxivId, isSafePath } from "./validation";

describe("Validation", () => {
  describe("isEmptyString", () => {
    it("should return true for empty string", () => {
      expect(isEmptyString("")).toBe(true);
    });

    it("should return true for whitespace only", () => {
      expect(isEmptyString("   ")).toBe(true);
      expect(isEmptyString("\n\t")).toBe(true);
    });

    it("should return false for non-empty string", () => {
      expect(isEmptyString("hello")).toBe(false);
      expect(isEmptyString(" hello ")).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("should return true for valid URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://example.com/path")).toBe(true);
      expect(isValidUrl("https://arxiv.org/abs/2301.12345")).toBe(true);
    });

    it("should return false for invalid URLs", () => {
      expect(isValidUrl("not a url")).toBe(false);
      expect(isValidUrl("example.com")).toBe(false);
      expect(isValidUrl("")).toBe(false);
    });
  });

  describe("isValidArxivId", () => {
    it("should return true for new format IDs", () => {
      expect(isValidArxivId("2301.12345")).toBe(true);
      expect(isValidArxivId("2301.1234")).toBe(true);
      expect(isValidArxivId("2301.12345v2")).toBe(true);
    });

    it("should return true for old format IDs", () => {
      expect(isValidArxivId("cs-lg/0601234")).toBe(true);
      expect(isValidArxivId("math/0601234")).toBe(true);
    });

    it("should return false for invalid IDs", () => {
      expect(isValidArxivId("invalid")).toBe(false);
      expect(isValidArxivId("123.456")).toBe(false);
      expect(isValidArxivId("")).toBe(false);
    });
  });

  describe("isSafePath", () => {
    it("should return true for safe paths", () => {
      expect(isSafePath("Papers")).toBe(true);
      expect(isSafePath("Papers/Research")).toBe(true);
      expect(isSafePath("folder/subfolder/file.md")).toBe(true);
    });

    it("should return false for paths with traversal", () => {
      expect(isSafePath("../Papers")).toBe(false);
      expect(isSafePath("Papers/../Other")).toBe(false);
      expect(isSafePath("../../etc/passwd")).toBe(false);
    });

    it("should return false for absolute paths", () => {
      expect(isSafePath("/Papers")).toBe(false);
      expect(isSafePath("/home/user/vault")).toBe(false);
    });
  });
});
