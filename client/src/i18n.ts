export type Locale =
  | "en"
  | "ar"
  | "es"
  | "pt"
  | "fr"
  | "de"
  | "it"
  | "tr"
  | "ja"
  | "ko"
  | "zh"
  | "hi"
  | "ru"
  | "id";

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

const english = {
  home: "Home",
  subjects: "Subjects",
  plan: "Study plan",
  review: "Review me",
  progress: "Progress",
  saved: "Saved items",
  settings: "Settings",
  startStudying: "Start studying",
  whatNext: "What should you study now?",
  goodMorning: "Good morning",
  goodAfternoon: "Good afternoon",
  goodEvening: "Good evening",
  signIn: "Sign in",
  signOut: "Sign out",
  createSubject: "Create subject",
  todayGoal: "Today's goal",
  streak: "Study streak",
  overallProgress: "Overall progress",
  upcomingExams: "Upcoming exams",
  weakTopics: "Weak topics",
};

const arabic: typeof english = {
  home: "الرئيسية",
  subjects: "المواد",
  plan: "خطة الدراسة",
  review: "راجعني",
  progress: "التقدم",
  saved: "العناصر المحفوظة",
  settings: "الإعدادات",
  startStudying: "ابدأ الدراسة",
  whatNext: "ماذا ينبغي أن تدرس الآن؟",
  goodMorning: "صباح الخير",
  goodAfternoon: "مساء الخير",
  goodEvening: "مساء الخير",
  signIn: "تسجيل الدخول",
  signOut: "تسجيل الخروج",
  createSubject: "إنشاء مادة",
  todayGoal: "هدف اليوم",
  streak: "سلسلة الدراسة",
  overallProgress: "التقدم العام",
  upcomingExams: "الاختبارات القادمة",
  weakTopics: "المواضيع الضعيفة",
};

export type TranslationKey = keyof typeof english;
export const dictionary = { en: english, ar: arabic } as const;

export function getDictionary(locale: Locale) {
  return dictionary[locale as keyof typeof dictionary] ?? english;
}

export function getDirection(locale: Locale) {
  return supportedLocales.find((item) => item.code === locale)?.dir ?? "ltr";
}
