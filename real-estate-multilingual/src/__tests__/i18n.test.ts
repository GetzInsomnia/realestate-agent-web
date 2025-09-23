import { describe, expect, it } from "vitest";
import { createAppTranslator, fallbackLocale, loadMessages } from "@/lib/i18n";

describe("i18n helpers", () => {
  it("falls back to the default locale when messages are missing", async () => {
    const result = await loadMessages("xx");
    expect(result.locale).toBe(fallbackLocale);
  });

  it("creates a translator with known keys", async () => {
    const translator = await createAppTranslator("en");
    expect(translator("home.hero.title")).toContain("Luxury homes");
  });
});
