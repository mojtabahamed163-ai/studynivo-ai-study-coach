import { generatedCatalogs } from "./i18n.generated";

export type Locale = "en" | "ar" | "es" | "pt" | "fr" | "de" | "it" | "tr" | "ja" | "ko" | "zh" | "hi" | "ru" | "id";

export const supportedLocales: Array<{ code: Locale; label: string; dir: "ltr" | "rtl" }> = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "pt", label: "Português", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
  { code: "it", label: "Italiano", dir: "ltr" },
  { code: "tr", label: "Türkçe", dir: "ltr" },
  { code: "ja", label: "日本語", dir: "ltr" },
  { code: "ko", label: "한국어", dir: "ltr" },
  { code: "zh", label: "简体中文", dir: "ltr" },
  { code: "hi", label: "हिन्दी", dir: "ltr" },
  { code: "ru", label: "Русский", dir: "ltr" },
  { code: "id", label: "Bahasa Indonesia", dir: "ltr" },
];

export type TranslationKey = keyof typeof generatedCatalogs.en;
export const dictionary = generatedCatalogs;
let activeLocale: Locale = "en";

export function setActiveLocale(locale: Locale) {
  activeLocale = locale;
}

export function getDictionary(locale: Locale) {
  return dictionary[locale] ?? dictionary.en;
}

export function trStatic(source: string, locale: Locale = activeLocale) {
  const catalog = dictionary[locale] as Record<string, string> | undefined;
  return catalog?.[source] ?? source;
}

export function getDirection(locale: Locale) {
  return supportedLocales.find((item) => item.code === locale)?.dir ?? "ltr";
}

export function formatExamText(date: string | undefined, locale: Locale = activeLocale) {
  if (!date) return trStatic("No exam date", locale);
  const days = Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000));
  if (days === 0) return trStatic("Exam today", locale);
  return new Intl.RelativeTimeFormat(locale, { numeric: "always" }).format(days, "day");
}

export function formatNumber(value: number, locale: Locale = activeLocale) {
  return new Intl.NumberFormat(locale).format(value);
}
