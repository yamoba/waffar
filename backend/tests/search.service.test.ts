import { describe, expect, it } from "vitest";
import { detectLanguage, expandSynonyms, normalizeQuery, transliterate } from "../src/services/search";

describe("search service", () => {
  it("normalizes spacing, casing, and noise words", () => {
    expect(normalizeQuery("  The   iPhone 15 For Egypt  ")).toBe("iphone 15  egypt");
  });

  it("detects English and Arabizi-like queries", () => {
    expect(detectLanguage("iphone 15")).toBe("en");
    expect(detectLanguage("3araby")).toBe("arabizi");
    expect(detectLanguage("ايفون")).toBe("ar");
  });

  it("expands product synonyms for common shopping terms", () => {
    expect(expandSynonyms("best phone under 20000")).toContain("smartphone");
  });

  it("transliterates known store search aliases", () => {
    expect(transliterate("iphone")).toBeTruthy();
  });
});
