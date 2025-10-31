import { describe, it, expect } from "vitest";
import { ok, err, map, andThen, unwrap } from "./result";

describe("Result", () => {
  describe("ok", () => {
    it("should create successful result", () => {
      const result = ok(42);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(42);
      }
    });
  });

  describe("err", () => {
    it("should create error result", () => {
      const result = err("Error message");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Error message");
      }
    });
  });

  describe("map", () => {
    it("should map successful result", () => {
      const result = ok(10);
      const mapped = map(result, (x) => x * 2);

      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.value).toBe(20);
      }
    });

    it("should not map error result", () => {
      const result = err("Error");
      const mapped = map(result, (x) => x * 2);

      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBe("Error");
      }
    });
  });

  describe("andThen", () => {
    it("should chain successful results", () => {
      const result = ok(10);
      const chained = andThen(result, (x) => ok(x * 2));

      expect(chained.success).toBe(true);
      if (chained.success) {
        expect(chained.value).toBe(20);
      }
    });

    it("should short-circuit on error", () => {
      const result = err("Error");
      const chained = andThen(result, (x) => ok(x * 2));

      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toBe("Error");
      }
    });

    it("should propagate error from chain", () => {
      const result = ok(10);
      const chained = andThen(result, () => err("Chain error"));

      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toBe("Chain error");
      }
    });
  });

  describe("unwrap", () => {
    it("should unwrap successful result", () => {
      const result = ok(42);
      const value = unwrap(result);

      expect(value).toBe(42);
    });

    it("should throw on error result", () => {
      const result = err("Error");

      expect(() => unwrap(result)).toThrow();
    });
  });
});
