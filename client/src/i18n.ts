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

const supplementalTranslations: Partial<Record<Locale, Record<string, string>>> = {
  ar: {
    "30 minutes": "30 دقيقة", "6 days": "6 أيام", "2 tasks": "مهمتان", min: "دقيقة", days: "أيام", "min studied": "دقيقة دراسة", "weak topics": "مواضيع ضعيفة",
    Understand: "افهم", "Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.": "حوّل المحاضرات والملاحظات والصور والصوت إلى مواضيع وشروحات وملخصات مرتبطة بالمصادر.", Practice: "مارس", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.": "احصل على أسئلة تناسب المادة، من التعريفات والحسابات إلى التفكير المفتوح.", "Know what is next": "اعرف خطوتك التالية", "Study Manager weighs exams, weak areas, confidence, and time to choose the next useful session.": "يوازن مدير الدراسة بين الامتحانات ونقاط الضعف والثقة والوقت لاختيار الجلسة التالية المفيدة.", "Separate subject spaces": "مساحات منفصلة لكل مادة", "Save what matters": "احفظ ما يهمك", "Sessions that resume": "جلسات قابلة للاستئناف", "Private by design": "الخصوصية أساس التصميم", Low: "منخفض", Medium: "متوسط", High: "مرتفع", Page: "صفحة", Score: "النتيجة", "One focused question": "سؤال واحد مركز", "Strong topic": "موضوع قوي", "Keep it warm": "حافظ على مستواه", "Next step": "الخطوة التالية", "Review mistakes": "راجع الأخطاء", Confidence: "الثقة", Easy: "سهل", Good: "جيد", "Need review": "يحتاج مراجعة",
  },
  es: { "30 minutes": "30 minutos", "6 days": "6 días", "2 tasks": "2 tareas", min: "min", days: "días", "min studied": "min estudiados", "weak topics": "temas débiles", Understand: "Comprender", "Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.": "Convierte clases, notas, imágenes y audio en temas, explicaciones y resúmenes vinculados a fuentes.", Practice: "Practicar", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.": "Obtén preguntas adaptadas a la materia, desde definiciones y cálculos hasta razonamiento abierto.", "Know what is next": "Saber qué sigue", "Study Manager weighs exams, weak areas, confidence, and time to choose the next useful session.": "El planificador considera exámenes, puntos débiles, confianza y tiempo para elegir la próxima sesión útil.", "Separate subject spaces": "Espacios separados por materia", "Save what matters": "Guarda lo importante", "Sessions that resume": "Sesiones que se reanudan", "Private by design": "Privacidad desde el diseño", Low: "Baja", Medium: "Media", High: "Alta", Page: "Página", Score: "Puntuación", "One focused question": "Una pregunta enfocada", "Strong topic": "Tema fuerte", "Keep it warm": "Mantén el nivel", "Next step": "Siguiente paso", "Review mistakes": "Revisa los errores", Confidence: "Confianza", Easy: "Fácil", Good: "Bien", "Need review": "Necesita repaso" },
  pt: { "30 minutes": "30 minutos", "6 days": "6 dias", "2 tasks": "2 tarefas", min: "min", days: "dias", "min studied": "min estudados", "weak topics": "tópicos fracos", Understand: "Entender", "Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.": "Transforme aulas, notas, imagens e áudio em tópicos, explicações e resumos ligados às fontes.", Practice: "Praticar", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.": "Receba perguntas adequadas à matéria, de definições e cálculos a raciocínio aberto.", "Know what is next": "Saiba o próximo passo", "Study Manager weighs exams, weak areas, confidence, and time to choose the next useful session.": "O planejador considera provas, pontos fracos, confiança e tempo para escolher a próxima sessão útil.", "Separate subject spaces": "Espaços separados por matéria", "Save what matters": "Salve o que importa", "Sessions that resume": "Sessões retomáveis", "Private by design": "Privacidade desde o design", Low: "Baixa", Medium: "Média", High: "Alta", Page: "Página", Score: "Pontuação", "One focused question": "Uma pergunta focada", "Strong topic": "Tópico forte", "Keep it warm": "Mantenha o nível", "Next step": "Próximo passo", "Review mistakes": "Revise os erros", Confidence: "Confiança", Easy: "Fácil", Good: "Bom", "Need review": "Precisa revisar" },
  fr: { "30 minutes": "30 minutes", "6 days": "6 jours", "2 tasks": "2 tâches", min: "min", days: "jours", "min studied": "min étudiées", "weak topics": "thèmes faibles", Understand: "Comprendre", "Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.": "Transformez cours, notes, images et audio en thèmes, explications et résumés liés aux sources.", Practice: "Pratiquer", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.": "Obtenez des questions adaptées à la matière, des définitions aux calculs et au raisonnement ouvert.", "Know what is next": "Savoir quoi faire ensuite", "Study Manager weighs exams, weak areas, confidence, and time to choose the next useful session.": "Le planificateur tient compte des examens, faiblesses, confiance et temps pour choisir la prochaine session utile.", "Separate subject spaces": "Espaces séparés par matière", "Save what matters": "Enregistrer l’essentiel", "Sessions that resume": "Sessions reprenables", "Private by design": "Confidentialité par conception", Low: "Faible", Medium: "Moyenne", High: "Élevée", Page: "Page", Score: "Score", "One focused question": "Une question ciblée", "Strong topic": "Thème solide", "Keep it warm": "Entretenez ce niveau", "Next step": "Prochaine étape", "Review mistakes": "Revoir les erreurs", Confidence: "Confiance", Easy: "Facile", Good: "Bien", "Need review": "À revoir" },
  de: { "30 minutes": "30 Minuten", "6 days": "6 Tage", "2 tasks": "2 Aufgaben", min: "Min.", days: "Tage", "min studied": "Min. gelernt", "weak topics": "schwache Themen", Understand: "Verstehen", "Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.": "Verwandle Vorlesungen, Notizen, Bilder und Audio in Themen, Erklärungen und quellenbezogene Zusammenfassungen.", Practice: "Üben", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.": "Erhalte passende Fragen, von Definitionen und Berechnungen bis zum offenen Denken.", "Know what is next": "Wissen, was als Nächstes kommt", "Study Manager weighs exams, weak areas, confidence, and time to choose the next useful session.": "Der Lernplaner berücksichtigt Prüfungen, Schwächen, Vertrauen und Zeit für die nächste sinnvolle Sitzung.", "Separate subject spaces": "Getrennte Fachbereiche", "Save what matters": "Wichtiges speichern", "Sessions that resume": "Fortsetzbare Sitzungen", "Private by design": "Datenschutz als Grundprinzip", Low: "Niedrig", Medium: "Mittel", High: "Hoch", Page: "Seite", Score: "Punktzahl", "One focused question": "Eine fokussierte Frage", "Strong topic": "Starkes Thema", "Keep it warm": "Auf dem Niveau bleiben", "Next step": "Nächster Schritt", "Review mistakes": "Fehler wiederholen", Confidence: "Sicherheit", Easy: "Einfach", Good: "Gut", "Need review": "Wiederholen" },
  it: { "30 minutes": "30 minuti", "6 days": "6 giorni", "2 tasks": "2 attività", min: "min", days: "giorni", "min studied": "min studiati", "weak topics": "argomenti deboli", Understand: "Capire", "Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.": "Trasforma lezioni, note, immagini e audio in argomenti, spiegazioni e sintesi collegate alle fonti.", Practice: "Esercitarsi", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.": "Ottieni domande adatte alla materia, da definizioni e calcoli al ragionamento aperto.", "Know what is next": "Sapere cosa viene dopo", "Study Manager weighs exams, weak areas, confidence, and time to choose the next useful session.": "Il pianificatore considera esami, punti deboli, fiducia e tempo per scegliere la prossima sessione utile.", "Separate subject spaces": "Spazi separati per materia", "Save what matters": "Salva ciò che conta", "Sessions that resume": "Sessioni riprendibili", "Private by design": "Privacy integrata nel design", Low: "Bassa", Medium: "Media", High: "Alta", Page: "Pagina", Score: "Punteggio", "One focused question": "Una domanda mirata", "Strong topic": "Argomento forte", "Keep it warm": "Mantieni il livello", "Next step": "Prossimo passo", "Review mistakes": "Rivedi gli errori", Confidence: "Sicurezza", Easy: "Facile", Good: "Bene", "Need review": "Da rivedere" },
  tr: { "30 minutes": "30 dakika", "6 days": "6 gün", "2 tasks": "2 görev", min: "dk", days: "gün", "min studied": "çalışılan dk", "weak topics": "zayıf konular", Understand: "Anla", "Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.": "Dersleri, notları, görselleri ve sesi konulara, açıklamalara ve kaynak bağlantılı özetlere dönüştür.", Practice: "Pratik yap", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.": "Tanımlardan hesaplamalara ve açık uçlu düşünmeye kadar derse uygun sorular al.", "Know what is next": "Sırada ne olduğunu bil", "Study Manager weighs exams, weak areas, confidence, and time to choose the next useful session.": "Çalışma planlayıcı sınavları, zayıf alanları, güveni ve zamanı değerlendirir.", "Separate subject spaces": "Ayrı ders alanları", "Save what matters": "Önemli olanı kaydet", "Sessions that resume": "Devam edilebilir oturumlar", "Private by design": "Tasarımın temeli gizlilik", Low: "Düşük", Medium: "Orta", High: "Yüksek", Page: "Sayfa", Score: "Puan", "One focused question": "Tek odaklı soru", "Strong topic": "Güçlü konu", "Keep it warm": "Seviyeyi koru", "Next step": "Sonraki adım", "Review mistakes": "Hataları gözden geçir", Confidence: "Güven", Easy: "Kolay", Good: "İyi", "Need review": "Tekrar gerekli" },
  ja: { "30 minutes": "30分", "6 days": "6日", "2 tasks": "2つのタスク", min: "分", days: "日", "min studied": "学習時間", "weak topics": "苦手なトピック", Understand: "理解", "Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.": "講義、ノート、画像、音声をトピック、解説、出典付き要約に変換します。", Practice: "練習", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.": "定義や計算から自由記述の推論まで、科目に合った問題を出します。", "Know what is next": "次にすることを知る", "Study Manager weighs exams, weak areas, confidence, and time to choose the next useful session.": "試験、苦手分野、自信、時間を考慮して次の学習を選びます。", "Separate subject spaces": "科目ごとのスペース", "Save what matters": "大切なものを保存", "Sessions that resume": "再開できるセッション", "Private by design": "プライバシー重視", Low: "低い", Medium: "中", High: "高い", Page: "ページ", Score: "スコア", "One focused question": "集中した1問", "Strong topic": "得意なトピック", "Keep it warm": "感覚を保つ", "Next step": "次のステップ", "Review mistakes": "間違いを復習", Confidence: "自信", Easy: "簡単", Good: "良い", "Need review": "要復習" },
  ko: { "30 minutes": "30분", "6 days": "6일", "2 tasks": "작업 2개", min: "분", days: "일", "min studied": "학습 시간", "weak topics": "취약한 주제", Understand: "이해", "Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.": "강의, 노트, 이미지와 오디오를 주제, 설명, 출처가 연결된 요약으로 바꿉니다.", Practice: "연습", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.": "정의와 계산부터 개방형 추론까지 과목에 맞는 문제를 받습니다.", "Know what is next": "다음 할 일 알기", "Study Manager weighs exams, weak areas, confidence, and time to choose the next useful session.": "시험, 취약점, 자신감과 시간을 고려해 다음 학습을 선택합니다.", "Separate subject spaces": "과목별 공간", "Save what matters": "중요한 내용 저장", "Sessions that resume": "재개 가능한 세션", "Private by design": "설계부터 개인정보 보호", Low: "낮음", Medium: "보통", High: "높음", Page: "페이지", Score: "점수", "One focused question": "집중 문제 하나", "Strong topic": "강한 주제", "Keep it warm": "감각 유지", "Next step": "다음 단계", "Review mistakes": "실수 복습", Confidence: "자신감", Easy: "쉬움", Good: "좋음", "Need review": "복습 필요" },
  zh: { "30 minutes": "30分钟", "6 days": "6天", "2 tasks": "2个任务", min: "分钟", days: "天", "min studied": "学习分钟", "weak topics": "薄弱主题", Understand: "理解", "Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.": "将讲座、笔记、图片和音频转成主题、解释和带来源的摘要。", Practice: "练习", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.": "获得适合这门课的问题，从定义和计算到开放式推理。", "Know what is next": "知道下一步", "Study Manager weighs exams, weak areas, confidence, and time to choose the next useful session.": "学习计划会结合考试、薄弱点、信心和时间选择下一次有效学习。", "Separate subject spaces": "独立的科目空间", "Save what matters": "保存重要内容", "Sessions that resume": "可继续的学习会话", "Private by design": "以隐私为设计基础", Low: "低", Medium: "中", High: "高", Page: "页", Score: "得分", "One focused question": "一道聚焦问题", "Strong topic": "擅长主题", "Keep it warm": "保持熟练", "Next step": "下一步", "Review mistakes": "复习错误", Confidence: "信心", Easy: "简单", Good: "不错", "Need review": "需要复习" },
  hi: { "30 minutes": "30 मिनट", "6 days": "6 दिन", "2 tasks": "2 कार्य", min: "मिनट", days: "दिन", "min studied": "पढ़े गए मिनट", "weak topics": "कमज़ोर विषय", Understand: "समझें", "Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.": "लेक्चर, नोट्स, चित्र और ऑडियो को विषयों, व्याख्याओं और स्रोत-लिंक वाले सारांश में बदलें।", Practice: "अभ्यास करें", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.": "परिभाषाओं और गणनाओं से लेकर खुले तर्क तक विषय के अनुरूप प्रश्न पाएं।", "Know what is next": "अगला कदम जानें", "Study Manager weighs exams, weak areas, confidence, and time to choose the next useful session.": "स्टडी मैनेजर परीक्षा, कमज़ोर क्षेत्रों, आत्मविश्वास और समय से अगला उपयोगी सत्र चुनता है।", "Separate subject spaces": "अलग विषय स्थान", "Save what matters": "ज़रूरी चीज़ें सहेजें", "Sessions that resume": "फिर शुरू होने वाले सत्र", "Private by design": "डिज़ाइन में गोपनीयता", Low: "कम", Medium: "मध्यम", High: "उच्च", Page: "पृष्ठ", Score: "स्कोर", "One focused question": "एक केंद्रित प्रश्न", "Strong topic": "मज़बूत विषय", "Keep it warm": "अभ्यास बनाए रखें", "Next step": "अगला कदम", "Review mistakes": "गलतियों की समीक्षा", Confidence: "आत्मविश्वास", Easy: "आसान", Good: "अच्छा", "Need review": "समीक्षा चाहिए" },
  ru: { "30 minutes": "30 минут", "6 days": "6 дней", "2 tasks": "2 задачи", min: "мин", days: "дней", "min studied": "мин. изучено", "weak topics": "слабые темы", Understand: "Понять", "Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.": "Превращайте лекции, заметки, изображения и аудио в темы, объяснения и резюме с источниками.", Practice: "Практиковаться", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.": "Получайте вопросы по предмету: от определений и расчётов до открытого рассуждения.", "Know what is next": "Знать следующий шаг", "Study Manager weighs exams, weak areas, confidence, and time to choose the next useful session.": "Планировщик учитывает экзамены, слабые места, уверенность и время.", "Separate subject spaces": "Отдельные пространства предметов", "Save what matters": "Сохранить важное", "Sessions that resume": "Возобновляемые сессии", "Private by design": "Конфиденциальность в основе", Low: "Низкая", Medium: "Средняя", High: "Высокая", Page: "Страница", Score: "Результат", "One focused question": "Один сфокусированный вопрос", "Strong topic": "Сильная тема", "Keep it warm": "Поддерживайте уровень", "Next step": "Следующий шаг", "Review mistakes": "Повторить ошибки", Confidence: "Уверенность", Easy: "Легко", Good: "Хорошо", "Need review": "Нужно повторить" },
  id: { "30 minutes": "30 menit", "6 days": "6 hari", "2 tasks": "2 tugas", min: "mnt", days: "hari", "min studied": "mnt belajar", "weak topics": "topik lemah", Understand: "Pahami", "Turn lectures, notes, images, and audio into topics, explanations, and source-linked summaries.": "Ubah kuliah, catatan, gambar, dan audio menjadi topik, penjelasan, dan ringkasan dengan sumber.", Practice: "Berlatih", "Get questions that fit the subject — from definitions to calculations and open-ended reasoning.": "Dapatkan pertanyaan sesuai pelajaran, dari definisi dan perhitungan hingga penalaran terbuka.", "Know what is next": "Tahu langkah berikutnya", "Study Manager weighs exams, weak areas, confidence, and time to choose the next useful session.": "Pengelola belajar mempertimbangkan ujian, kelemahan, keyakinan, dan waktu untuk memilih sesi berikutnya.", "Separate subject spaces": "Ruang terpisah tiap pelajaran", "Save what matters": "Simpan yang penting", "Sessions that resume": "Sesi yang dapat dilanjutkan", "Private by design": "Privasi sejak awal desain", Low: "Rendah", Medium: "Sedang", High: "Tinggi", Page: "Halaman", Score: "Nilai", "One focused question": "Satu pertanyaan fokus", "Strong topic": "Topik kuat", "Keep it warm": "Pertahankan kemampuan", "Next step": "Langkah berikutnya", "Review mistakes": "Tinjau kesalahan", Confidence: "Keyakinan", Easy: "Mudah", Good: "Bagus", "Need review": "Perlu ditinjau" },
};

const appearanceTranslations: Partial<Record<Locale, Record<string, string>>> = {
  en: {
    Appearance: "Appearance",
    "Choose how StudyNivo looks.": "Choose how StudyNivo looks.",
    "Light appearance": "Light appearance",
    "Dark appearance": "Dark appearance",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.",
  },
  ar: {
    Appearance: "المظهر",
    "Choose how StudyNivo looks.": "اختر مظهر StudyNivo الذي تفضّله.",
    "Light appearance": "المظهر الفاتح",
    "Dark appearance": "المظهر الداكن",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "إذا كان لديك حساب بهذا المعرّف فسجّل الدخول؛ وإلا فحسابك جاهز. سجّل الدخول للمتابعة.",
  },
  es: {
    Appearance: "Apariencia",
    "Choose how StudyNivo looks.": "Elige cómo se ve StudyNivo.",
    "Light appearance": "Apariencia clara",
    "Dark appearance": "Apariencia oscura",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "Si ya existe una cuenta con ese identificador, inicia sesión; si no, tu cuenta está lista. Inicia sesión para continuar.",
  },
  pt: {
    Appearance: "Aparência",
    "Choose how StudyNivo looks.": "Escolha a aparência do StudyNivo.",
    "Light appearance": "Aparência clara",
    "Dark appearance": "Aparência escura",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "Se já existir uma conta com esse identificador, entre; caso contrário, sua conta está pronta. Entre para continuar.",
  },
  fr: {
    Appearance: "Apparence",
    "Choose how StudyNivo looks.": "Choisissez l’apparence de StudyNivo.",
    "Light appearance": "Apparence claire",
    "Dark appearance": "Apparence sombre",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "Si un compte existe déjà avec cet identifiant, connectez-vous ; sinon, votre compte est prêt. Connectez-vous pour continuer.",
  },
  de: {
    Appearance: "Darstellung",
    "Choose how StudyNivo looks.": "Wähle das Erscheinungsbild von StudyNivo.",
    "Light appearance": "Helles Design",
    "Dark appearance": "Dunkles Design",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "Falls bereits ein Konto mit dieser Kennung besteht, melde dich an; andernfalls ist dein Konto bereit. Melde dich an, um fortzufahren.",
  },
  it: {
    Appearance: "Aspetto",
    "Choose how StudyNivo looks.": "Scegli l’aspetto di StudyNivo.",
    "Light appearance": "Aspetto chiaro",
    "Dark appearance": "Aspetto scuro",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "Se esiste già un account con questo identificativo, accedi; altrimenti il tuo account è pronto. Accedi per continuare.",
  },
  tr: {
    Appearance: "Görünüm",
    "Choose how StudyNivo looks.": "StudyNivo görünümünü seçin.",
    "Light appearance": "Açık görünüm",
    "Dark appearance": "Koyu görünüm",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "Bu kimlikle bir hesap varsa giriş yapın; yoksa hesabınız hazır. Devam etmek için giriş yapın.",
  },
  ja: {
    Appearance: "表示",
    "Choose how StudyNivo looks.": "StudyNivo の表示方法を選択します。",
    "Light appearance": "ライトテーマ",
    "Dark appearance": "ダークテーマ",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "この識別子のアカウントがすでにある場合はログインしてください。新規アカウントの場合は準備ができています。続行するにはログインしてください。",
  },
  ko: {
    Appearance: "화면 모양",
    "Choose how StudyNivo looks.": "StudyNivo의 화면 모양을 선택하세요.",
    "Light appearance": "밝은 화면",
    "Dark appearance": "어두운 화면",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "해당 식별자의 계정이 이미 있으면 로그인하고, 그렇지 않으면 계정이 준비됩니다. 계속하려면 로그인하세요.",
  },
  zh: {
    Appearance: "外观",
    "Choose how StudyNivo looks.": "选择 StudyNivo 的显示外观。",
    "Light appearance": "浅色外观",
    "Dark appearance": "深色外观",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "如果该标识已有账户，请登录；否则账户已准备就绪。请登录以继续。",
  },
  hi: {
    Appearance: "रूप-रंग",
    "Choose how StudyNivo looks.": "StudyNivo का रूप चुनें।",
    "Light appearance": "हल्का रूप",
    "Dark appearance": "गहरा रूप",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "यदि इस पहचान से खाता पहले से है, तो साइन इन करें; अन्यथा आपका खाता तैयार है। जारी रखने के लिए साइन इन करें।",
  },
  ru: {
    Appearance: "Оформление",
    "Choose how StudyNivo looks.": "Выберите оформление StudyNivo.",
    "Light appearance": "Светлое оформление",
    "Dark appearance": "Тёмное оформление",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "Если аккаунт с таким идентификатором уже есть, войдите; иначе аккаунт готов. Войдите, чтобы продолжить.",
  },
  id: {
    Appearance: "Tampilan",
    "Choose how StudyNivo looks.": "Pilih tampilan StudyNivo.",
    "Light appearance": "Tampilan terang",
    "Dark appearance": "Tampilan gelap",
    "If an account already exists with that identifier, sign in; otherwise your account is ready. Please sign in to continue.":
      "Jika akun dengan identitas itu sudah ada, silakan masuk; jika belum, akun Anda siap. Masuk untuk melanjutkan.",
  },
};

const reportTranslations: Partial<Record<Locale, Record<string, string>>> = {
  ar: {
    "A mock exam covers all indexed topics in this subject.": "يغطي الاختبار التجريبي جميع الموضوعات المفهرسة في هذه المادة.",
    "Could not generate source-grounded questions. Check indexed material and try again when the AI service is available.": "تعذر إنشاء أسئلة موثقة من المصادر. تحقق من فهرسة المادة وحاول مجددًا عند توفر خدمة الذكاء الاصطناعي.",
    "A mock exam creates one source-grounded question for every indexed topic, up to 50 topics.": "ينشئ الاختبار التجريبي سؤالًا موثقًا من المصدر لكل موضوع مفهرس، حتى 50 موضوعًا.",
    "Restoring your saved test…": "جارٍ استعادة اختبارك المحفوظ…",
    "Could not restore this test. Please return to the subject and start again.": "تعذرت استعادة هذا الاختبار. ارجع إلى المادة وابدأ مجددًا.",
    "This test has no remaining questions.": "لا توجد أسئلة متبقية في هذا الاختبار.",
    "Return to mistakes and low-confidence answers as well as cards due for review.": "راجع الأخطاء والإجابات منخفضة الثقة والبطاقات المستحقة للمراجعة.",
    "Missed quiz answers": "إجابات الاختبارات التي تحتاج مراجعة",
    "Practice again": "تدرّب مجددًا",
    "reviews waiting": "مراجعات بانتظارك",
    misses: "أخطاء",
    "No answer": "لا توجد إجابة",
    "Loading review queue…": "جارٍ تحميل قائمة المراجعة…",
    "Could not load your review queue. Please retry.": "تعذر تحميل قائمة المراجعة. حاول مرة أخرى.",
    "Your review queue is clear. Build grounded flashcards or finish a test with confidence to keep progress reliable.": "قائمة المراجعة فارغة. أنشئ بطاقات موثقة أو أجب بثقة في اختبار للحفاظ على تقدم موثوق.",
    "Exam soon — prioritize this topic": "الامتحان قريب — أعطِ هذا الموضوع أولوية",
    "Repeated mistakes need another recall pass": "الأخطاء المتكررة تحتاج إلى جولة استرجاع أخرى",
    "A spaced review is due": "حان موعد المراجعة المتباعدة",
    "Low confidence — check your recall": "الثقة منخفضة — اختبر استرجاعك للمعلومة",
    "Return to this topic after a study break": "عُد إلى هذا الموضوع بعد انقطاع عن الدراسة",
    "A weak topic needs another pass": "الموضوع الضعيف يحتاج إلى مراجعة أخرى",
    "Keep the concept active with recall": "حافظ على نشاط المفهوم عبر الاسترجاع",
    "Mock exam report": "تقرير الاختبار التجريبي",
    "Answer review": "مراجعة الإجابات",
    Correct: "إجابة صحيحة",
    "Review needed": "تحتاج إلى مراجعة",
    "Your answer": "إجابتك",
    "Correct answer": "الإجابة الصحيحة",
    Source: "المصدر",
    "Could not save this answer. Please retry.": "تعذر حفظ الإجابة. حاول مرة أخرى.",
    "Could not save this session. Please retry.": "تعذر حفظ الجلسة. حاول مرة أخرى.",
    "Practice report": "تقرير التدريب",
    "Your result is saved.": "تم حفظ نتيجتك.",
  },
};

export const studyTestTranslationKeys = [
  "Test what you can recall.",
  "Your answers and confidence are saved to this subject’s learning history.",
  "A mock exam creates one source-grounded question for every indexed topic, up to 50 topics.",
  "Restoring your saved test…",
  "Could not restore this test. Please return to the subject and start again.",
  "This test has no remaining questions.",
  "Start persisted test",
  "Preparing questions…",
  "Back to subject",
  "Could not generate source-grounded questions. Check indexed material and try again when the AI service is available.",
  "Saved mock exam",
  "Saved practice test",
  "Mock exam report",
  "Practice report",
  "Your result is saved.",
  "Answer review",
  "Correct",
  "Review needed",
  "Your answer",
  "Correct answer",
  "Source",
  "Exit test",
  "Finish test",
  "Save answer",
  "Could not save this answer. Please retry.",
] as const;

const studyTestRows: Partial<Record<Locale, readonly string[]>> = {
  ar: ["اختبر ما تتذكره.", "تُحفظ إجاباتك ومستوى ثقتك في سجل التعلم لهذه المادة.", "ينشئ الاختبار التجريبي سؤالًا موثقًا من المصدر لكل موضوع مفهرس، حتى 50 موضوعًا.", "جارٍ استعادة اختبارك المحفوظ…", "تعذرت استعادة هذا الاختبار. ارجع إلى المادة وابدأ مجددًا.", "لا توجد أسئلة متبقية في هذا الاختبار.", "ابدأ الاختبار المحفوظ", "جارٍ إعداد الأسئلة…", "العودة إلى المادة", "تعذر إنشاء أسئلة موثقة من المصدر. تحقق من المادة المفهرسة وحاول عند توفر خدمة الذكاء الاصطناعي.", "اختبار تجريبي محفوظ", "تدريب محفوظ", "تقرير الاختبار التجريبي", "تقرير التدريب", "تم حفظ نتيجتك.", "مراجعة الإجابات", "صحيح", "تحتاج إلى مراجعة", "إجابتك", "الإجابة الصحيحة", "المصدر", "الخروج من الاختبار", "إنهاء الاختبار", "حفظ الإجابة", "تعذر حفظ الإجابة. حاول مرة أخرى."],
  es: ["Pon a prueba lo que recuerdas.", "Tus respuestas y nivel de confianza se guardan en el historial de aprendizaje de esta asignatura.", "El examen simulado crea una pregunta basada en fuentes por cada tema indexado, hasta 50 temas.", "Restaurando tu prueba guardada…", "No se pudo restaurar esta prueba. Vuelve a la asignatura y empieza de nuevo.", "Esta prueba no tiene preguntas pendientes.", "Iniciar prueba guardada", "Preparando preguntas…", "Volver a la asignatura", "No se pudieron generar preguntas basadas en fuentes. Comprueba el material indexado e inténtalo cuando el servicio de IA esté disponible.", "Examen simulado guardado", "Práctica guardada", "Informe del examen simulado", "Informe de práctica", "Tu resultado se ha guardado.", "Revisión de respuestas", "Correcto", "Necesita repaso", "Tu respuesta", "Respuesta correcta", "Fuente", "Salir de la prueba", "Terminar prueba", "Guardar respuesta", "No se pudo guardar esta respuesta. Inténtalo de nuevo."],
  pt: ["Teste o que você consegue lembrar.", "Suas respostas e confiança ficam salvas no histórico de aprendizagem desta matéria.", "O simulado cria uma pergunta baseada nas fontes para cada tópico indexado, até 50 tópicos.", "Restaurando seu teste salvo…", "Não foi possível restaurar este teste. Volte à matéria e comece novamente.", "Este teste não tem perguntas restantes.", "Iniciar teste salvo", "Preparando perguntas…", "Voltar à matéria", "Não foi possível gerar perguntas com base nas fontes. Verifique o material indexado e tente quando o serviço de IA estiver disponível.", "Simulado salvo", "Prática salva", "Relatório do simulado", "Relatório de prática", "Seu resultado foi salvo.", "Revisão das respostas", "Correta", "Precisa revisar", "Sua resposta", "Resposta correta", "Fonte", "Sair do teste", "Finalizar teste", "Salvar resposta", "Não foi possível salvar esta resposta. Tente novamente."],
  fr: ["Testez ce dont vous vous souvenez.", "Vos réponses et votre niveau de confiance sont enregistrés dans l’historique d’apprentissage de cette matière.", "L’examen blanc crée une question sourcée pour chaque sujet indexé, jusqu’à 50 sujets.", "Restauration de votre test enregistré…", "Impossible de restaurer ce test. Revenez à la matière et recommencez.", "Il ne reste aucune question dans ce test.", "Commencer le test enregistré", "Préparation des questions…", "Retour à la matière", "Impossible de générer des questions sourcées. Vérifiez le contenu indexé et réessayez lorsque le service d’IA sera disponible.", "Examen blanc enregistré", "Exercice enregistré", "Rapport d’examen blanc", "Rapport d’exercice", "Votre résultat est enregistré.", "Correction des réponses", "Bonne réponse", "À revoir", "Votre réponse", "Bonne réponse", "Référence", "Quitter le test", "Terminer le test", "Enregistrer la réponse", "Impossible d’enregistrer cette réponse. Réessayez."],
  de: ["Teste, woran du dich erinnerst.", "Deine Antworten und deine Sicherheit werden im Lernverlauf dieses Fachs gespeichert.", "Die Prüfungssimulation erstellt für jedes indexierte Thema eine quellenbasierte Frage, bis zu 50 Themen.", "Gespeicherten Test wiederherstellen…", "Dieser Test konnte nicht wiederhergestellt werden. Kehre zum Fach zurück und starte erneut.", "Dieser Test enthält keine offenen Fragen mehr.", "Gespeicherten Test starten", "Fragen werden vorbereitet…", "Zurück zum Fach", "Quellenbasierte Fragen konnten nicht erstellt werden. Prüfe das indexierte Material und versuche es erneut, sobald der KI-Dienst verfügbar ist.", "Gespeicherte Prüfungssimulation", "Gespeicherter Übungstest", "Bericht zur Prüfungssimulation", "Übungsbericht", "Dein Ergebnis wurde gespeichert.", "Antworten überprüfen", "Richtig", "Wiederholen", "Deine Antwort", "Richtige Antwort", "Quelle", "Test verlassen", "Test abschließen", "Antwort speichern", "Diese Antwort konnte nicht gespeichert werden. Bitte erneut versuchen."],
  it: ["Verifica ciò che ricordi.", "Le risposte e il livello di sicurezza sono salvati nella cronologia di apprendimento di questa materia.", "L’esame simulato crea una domanda basata sulle fonti per ogni argomento indicizzato, fino a 50 argomenti.", "Ripristino del test salvato…", "Impossibile ripristinare il test. Torna alla materia e ricomincia.", "Non ci sono altre domande in questo test.", "Avvia il test salvato", "Preparazione delle domande…", "Torna alla materia", "Impossibile generare domande basate sulle fonti. Controlla il materiale indicizzato e riprova quando il servizio AI sarà disponibile.", "Esame simulato salvato", "Esercitazione salvata", "Report dell’esame simulato", "Report dell’esercitazione", "Il risultato è stato salvato.", "Revisione delle risposte", "Corretta", "Da ripassare", "La tua risposta", "Risposta corretta", "Fonte", "Esci dal test", "Termina il test", "Salva risposta", "Impossibile salvare la risposta. Riprova."],
  tr: ["Neleri hatırladığını test et.", "Yanıtların ve güven düzeyin bu dersin öğrenme geçmişine kaydedilir.", "Deneme sınavı, dizine eklenen her konu için kaynaklı bir soru oluşturur; en fazla 50 konu.", "Kaydedilen test geri yükleniyor…", "Bu test geri yüklenemedi. Derse dönüp yeniden başlat.", "Bu testte yanıtlanacak soru kalmadı.", "Kaydedilen testi başlat", "Sorular hazırlanıyor…", "Derse dön", "Kaynaklı sorular oluşturulamadı. Dizine eklenen materyali kontrol et ve AI hizmeti kullanılabilir olduğunda tekrar dene.", "Kaydedilen deneme sınavı", "Kaydedilen alıştırma", "Deneme sınavı raporu", "Alıştırma raporu", "Sonucun kaydedildi.", "Yanıt incelemesi", "Doğru", "Tekrar gözden geçir", "Yanıtın", "Doğru yanıt", "Kaynak", "Testten çık", "Testi bitir", "Yanıtı kaydet", "Yanıt kaydedilemedi. Lütfen yeniden dene."],
  ja: ["思い出せることを確認しましょう。", "回答と自信度は、この科目の学習履歴に保存されます。", "模擬試験では、インデックス済みの各トピックについて出典付きの問題を最大50問作成します。", "保存したテストを復元しています…", "テストを復元できませんでした。科目に戻って、もう一度開始してください。", "このテストに未回答の問題はありません。", "保存したテストを開始", "問題を準備しています…", "科目に戻る", "出典に基づく問題を作成できませんでした。インデックス済みの教材を確認し、AIサービスが利用可能になってから再試行してください。", "保存済み模擬試験", "保存済み練習テスト", "模擬試験レポート", "練習レポート", "結果を保存しました。", "解答の確認", "正解", "復習が必要", "あなたの回答", "正解", "出典", "テストを終了", "テストを完了", "回答を保存", "回答を保存できませんでした。もう一度お試しください。"],
  ko: ["기억하는 내용을 확인해 보세요.", "답변과 자신감 수준이 이 과목의 학습 기록에 저장됩니다.", "모의시험은 색인된 각 주제에 대해 출처 기반 문제를 최대 50개 만듭니다.", "저장된 테스트를 복원하는 중…", "테스트를 복원하지 못했습니다. 과목으로 돌아가 다시 시작하세요.", "이 테스트에 남은 문제가 없습니다.", "저장된 테스트 시작", "문제를 준비하는 중…", "과목으로 돌아가기", "출처 기반 문제를 만들지 못했습니다. 색인된 자료를 확인하고 AI 서비스를 사용할 수 있을 때 다시 시도하세요.", "저장된 모의시험", "저장된 연습 테스트", "모의시험 보고서", "연습 보고서", "결과가 저장되었습니다.", "답변 검토", "정답", "복습 필요", "내 답변", "정답", "출처", "테스트 나가기", "테스트 완료", "답변 저장", "답변을 저장하지 못했습니다. 다시 시도하세요."],
  zh: ["测测你能回忆起什么。", "你的答案和信心程度会保存到这门课程的学习记录中。", "模拟考试为每个已索引主题生成一道有来源依据的问题，最多50个主题。", "正在恢复已保存的测试…", "无法恢复此测试。请返回课程并重新开始。", "此测试没有剩余问题。", "开始已保存的测试", "正在准备问题…", "返回课程", "无法生成有来源依据的问题。请检查已索引的材料，并在 AI 服务可用时重试。", "已保存的模拟考试", "已保存的练习测试", "模拟考试报告", "练习报告", "结果已保存。", "答案回顾", "正确", "需要复习", "你的答案", "正确答案", "来源", "退出测试", "完成测试", "保存答案", "无法保存此答案，请重试。"],
  hi: ["याद की गई बातों को परखें।", "आपके उत्तर और आत्मविश्वास इस विषय के सीखने के इतिहास में सहेजे जाते हैं।", "मॉक परीक्षा हर अनुक्रमित विषय के लिए स्रोत-आधारित प्रश्न बनाती है, अधिकतम 50 विषय।", "सहेजी गई परीक्षा बहाल हो रही है…", "यह परीक्षा बहाल नहीं हो सकी। विषय पर लौटें और फिर से शुरू करें।", "इस परीक्षा में कोई प्रश्न बाकी नहीं है।", "सहेजी गई परीक्षा शुरू करें", "प्रश्न तैयार हो रहे हैं…", "विषय पर लौटें", "स्रोत-आधारित प्रश्न नहीं बन सके। अनुक्रमित सामग्री जाँचें और AI सेवा उपलब्ध होने पर फिर प्रयास करें।", "सहेजी गई मॉक परीक्षा", "सहेजा गया अभ्यास परीक्षण", "मॉक परीक्षा रिपोर्ट", "अभ्यास रिपोर्ट", "आपका परिणाम सहेजा गया है।", "उत्तर समीक्षा", "सही", "पुनरावलोकन आवश्यक", "आपका उत्तर", "सही उत्तर", "स्रोत", "परीक्षा से बाहर जाएँ", "परीक्षा पूरी करें", "उत्तर सहेजें", "उत्तर सहेजा नहीं जा सका। फिर प्रयास करें।"],
  ru: ["Проверьте, что вы помните.", "Ваши ответы и уверенность сохраняются в истории обучения по этому предмету.", "Пробный экзамен создаёт вопрос с источником для каждой индексированной темы, до 50 тем.", "Восстанавливаем сохранённый тест…", "Не удалось восстановить тест. Вернитесь к предмету и начните снова.", "В этом тесте не осталось вопросов.", "Начать сохранённый тест", "Подготовка вопросов…", "Вернуться к предмету", "Не удалось создать вопросы с источниками. Проверьте индексированные материалы и повторите попытку, когда ИИ-сервис будет доступен.", "Сохранённый пробный экзамен", "Сохранённая тренировка", "Отчёт о пробном экзамене", "Отчёт о тренировке", "Результат сохранён.", "Разбор ответов", "Верно", "Нужно повторить", "Ваш ответ", "Правильный ответ", "Источник", "Выйти из теста", "Завершить тест", "Сохранить ответ", "Не удалось сохранить ответ. Попробуйте ещё раз."],
  id: ["Uji apa yang Anda ingat.", "Jawaban dan tingkat keyakinan Anda disimpan dalam riwayat belajar mata pelajaran ini.", "Ujian simulasi membuat satu soal bersumber untuk setiap topik terindeks, hingga 50 topik.", "Memulihkan tes tersimpan…", "Tes ini tidak dapat dipulihkan. Kembali ke mata pelajaran dan mulai lagi.", "Tidak ada soal tersisa dalam tes ini.", "Mulai tes tersimpan", "Menyiapkan soal…", "Kembali ke mata pelajaran", "Soal berbasis sumber tidak dapat dibuat. Periksa materi terindeks dan coba lagi saat layanan AI tersedia.", "Ujian simulasi tersimpan", "Latihan tersimpan", "Laporan ujian simulasi", "Laporan latihan", "Hasil Anda telah disimpan.", "Tinjauan jawaban", "Benar", "Perlu ditinjau", "Jawaban Anda", "Jawaban benar", "Sumber", "Keluar dari tes", "Selesaikan tes", "Simpan jawaban", "Jawaban tidak dapat disimpan. Silakan coba lagi."],
};

const studyTestTranslations: Partial<Record<Locale, Record<string, string>>> =
  Object.fromEntries(
    Object.entries(studyTestRows).map(([locale, values]) => {
      if (values.length !== studyTestTranslationKeys.length)
        throw new Error(`Study test translation count mismatch for ${locale}`);
      return [locale, Object.fromEntries(studyTestTranslationKeys.map((key, index) => [key, values[index]!]))];
    })
  );

export function setActiveLocale(locale: Locale) {
  activeLocale = locale;
}

export function getDictionary(locale: Locale) {
  return dictionary[locale] ?? dictionary.en;
}

export function trStatic(source: string, locale: Locale = activeLocale) {
  const catalog = dictionary[locale] as Record<string, string> | undefined;
  return (
    supplementalTranslations[locale]?.[source] ??
    appearanceTranslations[locale]?.[source] ??
    reportTranslations[locale]?.[source] ??
    studyTestTranslations[locale]?.[source] ??
    catalog?.[source] ??
    source
  );
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
