# StudyNivo — وثيقة التسليم والاستكمال

> هذه الوثيقة هي نقطة البداية لأي وكيل Manus أو مطوّر يربط مستودع GitHub ويكمل المشروع. يجب قراءتها مع `docs/PLAN.md` و`docs/برومبت.txt` قبل تعديل الكود.

## 1. تعريف المشروع

StudyNivo هو **مدير دراسة شخصي يعمل بالذكاء الاصطناعي**. لا يكتفي بتلخيص الملفات؛ بل يحاول فهم مواد الطالب، مواضيعه الضعيفة، مواعيد امتحاناته ووقته الفعلي، ثم يجيب عن السؤال: **What should I study now?**. التصميم المقصود هو Calm productivity SaaS / editorial study workspace: هادئ، قائم على الدليل، mobile-first، وبدون ازدحام أو leaderboards.

الاسم الحالي للمشروع هو `StudyNivo — Your Personal AI Study Coach`، ومجلده الأصلي في بيئة Manus هو `/home/ubuntu/studynivo`.

## 2. المستندات المرجعية

- `docs/برومبت.txt`: المواصفة الأصلية الكاملة التي قدمها صاحب المشروع.
- `docs/PLAN.md`: خطة التنفيذ وقرارات التصميم التقنية.
- `MANUS_SETUP.md`: خطوات ربط المستودع وتشغيله داخل حساب Manus آخر.
- `docs/PROJECT_HANDOFF.md`: هذا السجل، ويجب تحديثه مع كل مرحلة كبيرة.
- `docs/speech-storage-notes.md`: ملاحظات عقد Speech والتخزين.
- `client/public/manus-routes.json`: بيان المسارات المطلوب إبقاؤه متزامنًا مع الواجهة.

## 3. التشغيل المحلي

```bash
pnpm install
pnpm dev
```

الفحوصات الأساسية:

```bash
pnpm check
pnpm test
pnpm build
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:3000/manus-routes.json
```

المشروع React/Vite/TypeScript في الواجهة، Express/tRPC في الخادم، Drizzle/MySQL لقاعدة البيانات، وTailwind CSS للتنسيق. لا تُ committed `node_modules` أو `dist` أو أي أسرار. تعتمد الخدمات المُدارة على متغيرات Manus التي يحمّلها Webdev؛ لا تنسخ قيم الأسرار إلى GitHub.

## 4. ما تم إنجازه

### الأساس والهوية

تم بناء Landing Page ولوحة تحكم ومساحات مستقلة للمواد، مع مسارات للمواد، الخطة، المراجعة، التقدم، العناصر المحفوظة، الإعدادات، الجلسات والاختبارات. توجد مصادقة Manus OAuth وطبقة ownership في استعلامات الخادم، مع fallback محلي للمعاينة عند عدم وجود مستخدم.

التصميم يستخدم خلفية عاجية، نصًا كحليًا، ولون StudyNivo Teal `#0f766e`. تمت إضافة شعار SVG و`app.config.ts` وبيان المسارات العام.

### قاعدة البيانات والخادم

تمت إضافة جداول/كيانات `userProfiles`, `subjects`, `materials`, `materialJobs`, `topics`, `studySessions`, و`savedItems`، مع migrations Drizzle حتى `drizzle/0005_studynivo_learning_loop.sql`. الاستعلامات تتحقق من `userId` وملكية المادة/الموضوع قبل القراءة أو التعديل.

### رفع المواد ومعالجتها

الأنواع الحالية: PDF، DOCX، TXT/Markdown، PNG/JPEG/WebP، وMP3/WAV/OGG/M4A/WebM. رفع الملفات يمر عبر التحقق من MIME، الحجم، magic bytes، hash، الملكية، والتخزين الدائم. حد المستندات 20 MB وحد الصوت 50 MB.

المعالجة الحالية هي:

- PDF عبر `pdf-parse`.
- DOCX عبر `mammoth`.
- الصور عبر Manus AI vision OCR مع confidence وحالة `needs_review` عند عدم الوضوح.
- الصوت عبر Speech API متوافق مع Whisper، مع حفظ النص، اللغة، المدة، و`transcriptSegments` بالتوقيتات.
- حالات المعالجة: `queued`, `extracting`, `indexing`, `indexed`, `needs_review`, `failed`.
- يوجد Retry للمواد الفاشلة أو غير الواضحة.

### الذكاء الاصطناعي grounded

يوجد عميل AI مركزي في `server/ai/client.ts` يستخدم خدمة Manus المدمجة دون API خارجي. إجابات Ask Your Material تمرر لغة الواجهة وتستخدم سياق المادة فقط، مع تعليمات صريحة بعدم الاختلاق وذكر نقص السياق أو التعارضات.

تمت إضافة `server/ai/materialAnalysis.ts` لتحليل المادة على دفعات chunked واستخراج Topics منظمة بصيغة JSON. تحفظ Topics الجديدة مع `name`, `note`, و`sourceRef`، ويمنع التكرار. يوجد endpoint محمي `workspace.analyzeMaterial` وزر **Analyze topics** بجانب المادة المفهرسة.

### اللغات

الواجهة تدعم 14 لغة: English، العربية، Español، Português، Français، Deutsch، Italiano، Türkçe، 日本語، 한국어، 简体中文، हिन्दी، Русский، Bahasa Indonesia. توجد typed catalogs في `client/src/i18n.generated.ts`، وتغيير اتجاه الصفحة إلى RTL للعربية. لغة الواجهة مستقلة عن لغة المادة، وAI يستقبل `locale`.

### الرسمة البصرية الأخيرة

لم يكن في الكود الحالي عنصر باسم Profile واضح؛ العنصر المرئي المقابل كان بطاقة **Your rhythm** في لوحة التحكم. لذلك تم استبدال عرضها النصي المجرد برسمة SVG تعليمية في:

- `client/src/components/ProfileIllustration.tsx`
- `client/src/index.css`
- استخدام المكوّن داخل `Dashboard` في `client/src/App.tsx`

الرسمة تعرض طالبًا يدرس أمام كتاب، مؤشر تقدم 72%، وألوانًا متناسقة مع الهوية، مع responsive behavior وحركة بسيطة قابلة للتعطيل عبر `prefers-reduced-motion` العام.

## 5. ما تم فحصه بنجاح

آخر فحص مؤكد قبل التسليم:

- `pnpm check`: ناجح.
- `pnpm test`: ناجح؛ 6 ملفات اختبار و13 اختبارًا.
- `pnpm build`: ناجح. يوجد تحذير معروف عن script إعداد المنصة وحجم bundle، لكنه لا يفشل البناء.
- `GET /api/health`: يعيد `{"status":"ok"}`.
- `GET /manus-routes.json`: يعيد JSON صالحًا بكل المسارات الحالية.
- آخر checkpoint منشور ومؤكد: `83b5ae39b99f4c4fb00cd42ba775ea9cdbe4deaf`، والرابط العام: `https://studynivo-h3ddjjkx.manus.space`.

## 5.2 ما أُنجز في مرحلة حلقة التعلم الحالية

- أضيفت جداول additive لـ`flashcards` و`quiz_attempts` و`quiz_answers` مع user/subject scoping وفهارس due/review.
- أصبحت البطاقات مولدة ومحفوظة من Topics المادة، مع difficulty وconfidence وinterval وmistakeCount وnextReviewAt.
- أضيفت مراجعة متباعدة بسيطة: Need review تعيد البطاقة قريبًا، وGood/Easy تمدد الفترة حتى 30 يومًا.
- أصبح Practice Test ينشئ محاولة محفوظة ويخزن كل إجابة وثقة ونتيجة نهائية، بدل الاعتماد على الحالة المحلية فقط.
- بقي Full Mock Exam كتحسين لاحق؛ مسار Practice الحالي محفوظ، والأسئلة grounded في Topics المادة.
- تم تشغيل `pnpm check`, `pnpm test`, `pnpm build`, و`git diff --check` بنجاح.

## 5.1 ما أُنجز في جلسة الاستكمال الحالية

- أُضيف بحث grounded داخل تبويب **Materials** عبر `workspace.searchMaterials`، ويبحث فقط في المواد المفهرسة التابعة للمادة والمستخدم الحالي.
- النتائج تعرض مقتطفًا من النص مع اسم المصدر، القسم، ورقم الصفحة أو التوقيت الصوتي عند توفره، بدل عرض نتيجة غير قابلة للتتبع.
- أُضيف زر **Save** لكل نتيجة، ويستخدم مسار `workspace.saveItem` الموجود مع تحقق الملكية على الخادم.
- أُضيفت حالات واضحة للبحث: تحميل، عدم وجود نتائج، وتعذر الخدمة؛ ولا توجد نتائج وهمية أو fallback يخترع محتوى.
- تم التأكد من `pnpm check` و`pnpm test` و`pnpm build` و`git diff --check`، مع نجاح فحص `/api/health` و`/manus-routes.json` عبر خادم التطوير.

## 6. ما لم يُنجز بعد

هذه النقاط لا ينبغي أن يعتبرها الوكيل التالي مكتملة:

1. **البحث الصريح داخل المادة** أصبح متاحًا داخل تبويب Materials بنتائج grounded ومراجع أساسية. ما يزال تحسين retrieval الدلالي/الفهرسة المنفصلة (بدل إعادة تقسيم `textContent` عند البحث) عملًا لاحقًا.
2. **Flashcards الحقيقية** أصبحت persisted ومبنية من Topics مع difficulty وتتبع المراجعة؛ ما يزال تحسين التوليد الدلالي من chunks المباشرة عملًا لاحقًا.
3. **Review Me** أصبح يعتمد على بطاقات due مع confidence وinterval وmistakeCount؛ يحتاج لاحقًا لدمج كامل مع أخطاء الاختبارات وStudy Manager.
4. **Practice Test** أصبح نظامًا محفوظًا للمحاولات والإجابات والثقة والنتيجة، بينما **Full Mock Exam** ما يزال يحتاج مسارًا منفصلًا كاملًا بكل الأنواع والتقييمات.
5. **Study Manager** لديه scoring أولي، لكنه يحتاج دمجًا أعمق مع الأخطاء، الثقة، المحتوى المتبقي، السلوك الفعلي والجلسات.
6. **حفظ اللغة في userProfiles** يحتاج ربطًا صريحًا بواجهة الإعدادات بدل الاعتماد الأساسي على الحالة المحلية.
7. **تسجيل الصوت داخل التطبيق غير موجود عمدًا**؛ التطبيق يرفع ملفًا صوتيًا جاهزًا فقط، كما نصت الخطة.
8. **Email/Password وGoogle OAuth** لم يُشغّلا؛ Manus OAuth هو المسار الفعلي الحالي، ولا يجب إضافة أزرار نجاح وهمية.
9. **النشر العام النهائي** مكتمل ومؤكد بالإصدار `83b5ae3` على الرابط `https://studynivo-h3ddjjkx.manus.space`.
10. تم تنفيذ اختبار متصفح عام للمسارات، المصادقة للزائر، اللغات الأربع عشرة، RTL، وصندوق أخطاء JavaScript؛ لا توجد أخطاء في هذه المسارات. ما يزال الاختبار الكامل بعد تسجيل الدخول ورفع ملفات حقيقية يحتاج حساب طالب وبيانات اختبار.

## 7. ما فشل أو تعثر وكيفية التعامل معه

- **BuildKit publication failure:** أعد المحاولة من Webdev Dashboard أو من أداة النشر الرسمية بعد عودة BuildKit. لا تغيّر Dockerfile عشوائيًا قبل قراءة log النشر؛ البناء المحلي ناجح.
- **تحذير Vite:** `script src="/api/platform/config.js" ... without type="module"` تحذير starter موجود ولا يمنع الإنتاج حاليًا.
- **تحذير bundle:** ملف JS أكبر من 500 kB؛ يمكن لاحقًا تقسيم routes/components بـ`import()`، لكنه ليس blocker.
- **AI/Speech unavailable:** يجب أن تُظهر الواجهة حالة واضحة وRetry. لا تضع مفاتيح بديلة داخل الكود ولا تجعل fallback يخترع نصًا أو Topics.
- **الصوت القصير أو غير الواضح:** يبقى `needs_review` مع `SHORT_OR_EMPTY_TRANSCRIPT`، وليس `indexed`.

## 8. الاقتراحات المناسبة للمرحلة التالية

ابدأ بـ **Material Search**: أضف endpoint محميًا يستقبل `subjectId`, `query` ويعيد أفضل chunks مع `sourceRef`, `page`, `section`, وtimestamp. اعرض النتائج في تبويب Materials/Chat، وأضف زر Save لكل نتيجة.

بعد ذلك ابنِ جداول `flashcards`, `review_items`, `quiz_attempts`, و`quiz_answers` additive عبر Drizzle. أنشئ مولد Flashcards structured grounded من chunks، ثم سجّل `difficulty`, `lastReviewedAt`, `nextReviewAt`, `confidence` و`mistakeCount`.

بعدها اربط Review Me وStudy Manager بهذه السجلات، مع scoring بسيط قابل للاختبار بدل نظام spaced repetition معقد. يجب أن تبقى كل عمليات القراءة والكتابة scoped بـ`userId` و`subjectId`.

قبل النشر، أضف اختبارًا حقيقيًا لمسار upload → processing → topic analysis، واختبار ownership يحاول مستخدم فيه الوصول إلى مادة مستخدم آخر، ثم عالج BuildKit من Dashboard وأثبت رابط النشر.

## 9. قواعد الاستكمال للوكيل التالي

اقرأ هذه الوثيقة والمواصفة قبل العمل. حافظ على `origin` الخاص بـManus إذا كان مطلوبًا للـcheckpoint، واستخدم remote باسم `github` فقط لمستودع GitHub. لا force-push ولا تحذف migrations موجودة. بعد كل مرحلة: شغّل `pnpm check`, `pnpm test`, `pnpm build`, افحص `git diff --check`، حدّث هذا الملف، ثم commit واضح.

لا تُدخل أسرارًا أو ملفات `.env` إلى المستودع. لا تغيّر عقد `manus-routes.json` دون تحديثه. لا تعتبر fallback المحلي بديلًا عن ownership في الخادم. أي إجابة AI يجب أن تبقى grounded في المادة وتصرّح بنقص المعلومات بدل التخمين.

## 10. سجل checkpoints

| Commit | المرحلة |
|---|---|
| `3999825` | كتالوج اللغات الـ14 وربط locale بالـAI |
| `4d9011e` | OCR الصور |
| `3b4786b` | رفع الصوت وSpeech transcription والتوقيتات |
| `57ecfc0` | تحليل Topics grounded وحفظها |
| `905c3ff` | استبدال خلفية بطاقة الإيقاع برسمة تعليمية SVG |


## 11. آخر تحديث شامل — جاهزية النقل إلى حساب Manus آخر

### ما أُنجز بعد آخر سجل سابق

- اكتمل البحث grounded داخل المواد مع مقتطفات ومراجع وحفظ النتائج.
- اكتملت حلقة التعلم المحفوظة: Flashcards، Review Me، Quiz Attempts وQuiz Answers مع ownership وdue review.
- اكتملت ترجمة الواجهة إلى اللغات الأربع عشرة، مع اختبار i18n وRTL للعربية.
- أُنشئ دليل طالب مختصر بالعربية، ثم دليل موحد بكل اللغات في `docs/STUDENT_GUIDE_ALL_LANGUAGES.md`.
- استُبدلت رسمة بطاقة الإيقاع داخل لوحة التحكم بمشهد دراسة واضح في `client/src/components/ProfileIllustration.tsx`.
- استُبدلت أيقونة التعريف الصغيرة للتطبيق قبل فتحه بأيقونة تعليمية جديدة: كتاب مفتوح وشرارة تركيز، بلا شخص أو رموز دينية أو تداول.
- الأيقونة الرسمية الدائمة مستخدمة في `app.config.ts`، ومضافة كـfavicon وApple touch icon في `client/index.html`.
- تم نشر الإصدار الأخير رسميًا: `83b5ae39b99f4c4fb00cd42ba775ea9cdbe4deaf`.

### نقل المشروع إلى حساب Manus آخر

1. اربط مستودع GitHub `mojtabahamed163-ai/studynivo-ai-study-coach` على الفرع `main`.
2. اقرأ `MANUS_SETUP.md` ثم هذا الملف و`docs/PLAN.md` و`docs/برومبت.txt`.
3. فعّل Web / Server وDatabase وManus Authentication وStorage وService API/AI/Speech من إعدادات الحساب الجديد.
4. لا تنشئ مشروعًا فارغًا ولا تنسخ الملفات يدويًا؛ استخدم المستودع نفسه حتى يبقى التاريخ وDrizzle migrations والوثائق كاملة.
5. شغّل `pnpm install`, ثم `pnpm check`, `pnpm test`, `pnpm build`, و`pnpm db:migrate` عند ربط قاعدة البيانات.
6. اترك remote الخاص بـManus للـcheckpoint إن كان موجودًا، واستخدم remote باسم `github` لمزامنة GitHub. لا تستخدم force-push.

### ما يحتاج عملًا لاحقًا

- اختبار end-to-end بعد تسجيل الدخول بحساب اختباري: إنشاء مادة، رفع PDF/DOCX/صورة/صوت، انتظار المعالجة، Analyze topics، Ask Your Material، Flashcards، Practice Test، Review Me وحفظ العناصر.
- تحسين retrieval الدلالي بدل إعادة تقسيم النص عند البحث.
- فصل Full Mock Exam عن Practice Test وتوسيع تقييمه.
- دمج أخطاء الاختبارات والثقة مع Study Manager وReview Me.
- حفظ locale في userProfiles بدل localStorage فقط.

### آخر commits المهمة

| Commit | الوصف |
|---|---|
| `affc1a9` | البحث grounded داخل المواد |
| `66c0ddc` | البطاقات والاختبارات المحفوظة |
| `0dcf5da` | طابور المراجعة العام |
| `c359ff7` | إكمال الترجمات متعددة اللغات |
| `fa51de2` | دليل الطالب بكل اللغات |
| `0bd4dba` | استبدال رسم لوحة التحكم بمشهد دراسة |
| `83b5ae3` | تعيين أيقونة StudyNivo التعليمية الرسمية ونشرها |
