import { describe, expect, it } from "vitest";
import {
  dictionary,
  getDirection,
  supportedLocales,
  trStatic,
  studyTestTranslationKeys,
} from "./i18n";

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

  it("does not fall back to English for core navigation and dashboard copy", () => {
    const keys = [
      "Home", "Subjects", "Study plan", "Review me", "Progress",
      "Saved items", "Language", "Sign out", "Today's goal", "Streak",
      "A realistic pace", "Study streak", "Consistency matters",
      "Overall progress", "Upcoming exams", "Dates shape priority",
      "today", "day study streak", "Continue where you paused",
      "optional", "e.g. Physics", "Overall mastery", "Across your spaces",
      "Study time", "Logged in sessions", "Current streak",
      "Personal consistency", "Saved for review", "Your evidence bank",
      "One focused question", "Low confidence matters",
    ];
    for (const locale of supportedLocales.filter(item => item.code !== "en")) {
      for (const key of keys) {
        expect(trStatic(key, locale.code), `${locale.code}: ${key}`).not.toBe(key);
      }
    }
  });

  it("translates the landing-page feature copy in every supported locale", () => {
    const keys = ["Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.", "Separate subject spaces", "30 minutes"];
    for (const locale of supportedLocales) {
      for (const key of keys) {
        expect(trStatic(key, locale.code)).toBeTruthy();
      }
    }
  });

  it("translates appearance and the detailed test report for Arabic RTL", () => {
    expect(trStatic("Dark appearance", "ar")).toBe("المظهر الداكن");
    expect(trStatic("Correct answer", "ar")).toBe("الإجابة الصحيحة");
    expect(trStatic("Mock exam report", "ar")).toBe("تقرير الاختبار التجريبي");
  });

  it("translates the full test and report flow in every supported locale", () => {
    for (const locale of supportedLocales.filter(item => item.code !== "en")) {
      for (const key of studyTestTranslationKeys) {
        expect(trStatic(key, locale.code), `${locale.code}: ${key}`).not.toBe(key);
      }
    }
  });

  it("translates authentication actions and the landing headline in every locale", () => {
    const keys = [
      "Create account",
      "Create a new account",
      "Already have an account? Sign in",
      "Stop wondering what you should study.",
    ];
    for (const locale of supportedLocales.filter(item => item.code !== "en")) {
      for (const key of keys) {
        expect(trStatic(key, locale.code), `${locale.code}: ${key}`).not.toBe(key);
      }
    }
    expect(trStatic("Stop wondering what you should study.", "ar")).toBe(
      "توقف عن التساؤل عما يجب دراسته."
    );
  });
});
