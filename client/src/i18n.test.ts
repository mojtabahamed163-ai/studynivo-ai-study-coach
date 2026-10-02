import { describe, expect, it } from "vitest";
import { dictionary, getDirection, supportedLocales, trStatic } from "./i18n";

describe("StudyNivo localization", () => {
  it("keeps all 14 locale catalogs aligned with English", () => {
    const englishKeys = Object.keys(dictionary.en).sort();
    expect(supportedLocales).toHaveLength(14);
    for (const locale of supportedLocales) {
      expect(Object.keys(dictionary[locale.code]).sort()).toEqual(englishKeys);
    }
  });

  it("uses RTL only for Arabic and translates a canonical UI string", () => {
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("en")).toBe("ltr");
    expect(trStatic("Settings.", "ar")).not.toBe("Settings.");
    expect(trStatic("Settings.", "ja")).not.toBe("Settings.");
  });

  it("translates the landing-page feature copy in every supported locale", () => {
    const keys = ["Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.", "Separate subject spaces", "30 minutes"];
    for (const locale of supportedLocales) {
      for (const key of keys) {
        expect(trStatic(key, locale.code)).toBeTruthy();
      }
    }
  });
});
