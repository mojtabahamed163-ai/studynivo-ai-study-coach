# StudyNivo — حزمة التسليم للحساب الجديد

**آخر تحديث:** 2026-10-04 09:55 (Europe/Athens)
**المستودع المطلوب:** `mojtabahamed163-ai/studynivo-ai-study-coach`
**الفرع:** `main`
**آخر كود قبل وثائق هذا التسليم:** `4c0b173` — إصلاح حفظ محاولات الاختبار في قاعدة البيانات
**بعد دفع وثائق هذا التسليم:** استخدم أحدث `HEAD` على `main`، ولا تعتمد على SHA قديم.

## الهدف

StudyNivo تطبيق ويب كامل، وليس صفحة ثابتة: مساحة دراسة شخصية مدعومة بالذكاء الاصطناعي. ينشئ الطالب مواد مستقلة، يضيف ملاحظاته وملفاته، يفهرسها التطبيق، يستخرج Topics grounded، ثم يستخدم Ask Material وPractice وFull Mock وFlashcards وReview Me وخطة الدراسة لمساعدته على اختيار الخطوة التالية.

## قاعدة مهمة للحساب الجديد

- أنشئ **مشروع WebDev جديدًا مملوكًا للحساب الجديد** مستوردًا من GitHub و`main`.
- لا تحاول ربط Resource URI أو مشروع WebDev القديم؛ GitHub ينقل الكود والوثائق فقط، ولا ينقل قاعدة البيانات أو الأسرار أو ملكية مشروع Manus.
- الموقع القديم/المؤقت `https://studynivo-ns7gtcfg.manus.space` يخص جلسة سابقة. لا تحاول استعادته أو تحديثه من الحساب الجديد؛ بعد نجاح الفحوص انشر المشروع الجديد وسيظهر رابط جديد.
- لا تنشئ قالبًا فارغًا ولا تحذف migrations أو ملفات المشروع.
- لا تضع كلمات مرور أو مفاتيح أو `DATABASE_URL` في GitHub أو الدردشة.

## ما أُنجز في الكود

- React/Vite/TypeScript للواجهة، Express/tRPC للخادم، Drizzle/MySQL لقاعدة البيانات.
- مصادقة بريد/هاتف مع كلمة مرور، جلسات موقعة، ownership checks، rate limiting، وإبطال الجلسات.
- إصلاح CSRF خلف البروكسي المنشور باستخدام `X-Forwarded-Host` في `server/_core/csrf.ts`؛ هذا كان سبب فشل تسجيل الدخول العام في النسخة الأولى.
- دعم 14 لغة وRTL للعربية والمظهر الفاتح/الداكن. أُصلحت تسميات تسجيل الدخول/إنشاء الحساب والعنوان العربي، لكن ما زالت هناك نصوص واجهة تحتاج تدقيقًا شاملًا بكل اللغات.
- إنشاء Subjects وMaterials، نصوص ملصقة ورفع ملفات، حالات indexing، Topics grounded، بحث داخل المادة، حفظ العناصر.
- Flashcards persisted من Topics؛ تم توليد 5 بطاقات في اختبار حي سابق.
- Ask Material grounded عبر خدمة Manus AI.
- Practice وFull Mock محفوظان في قاعدة البيانات مع الإجابات والثقة والنتيجة، ومنع كشف الإجابة/الدرجة أثناء المحاولة النشطة.
- إصلاح مراجع مصادر الاختبار في `server/ai/quizGeneration.ts` لتستخدم `Text section N` نفسه الذي تسجله Topics.
- إصلاح مخطط `quiz_attempts.status` في `drizzle/schema.ts` ليتطابق مع قاعدة البيانات (`status` وليس `quiz_status`)؛ هذا الإصلاح نُشر، لكن لم تُعاد عملية إنشاء الاختبار كاملة بعد آخر نشر لأن المستخدم طلب التوقف.
- `client/public/manus-routes.json` موجود ويجب تحديثه عند إضافة مسارات.
- Dockerfile وCI وmigrations `0000` إلى `0009` موجودة.

## ما ثبت في الاختبار العملي السابق

تم في مشروع Preview مؤقت بقاعدة Manus جديدة وحساب QA منفصل:

1. تشغيل التطبيق وتفعيل Server وDatabase.
2. إنشاء حساب وتسجيل الدخول العام بعد إصلاح CSRF.
3. إنشاء Subject باسم `Biology E2E QA` وحفظه في قاعدة البيانات.
4. لصق ملاحظات Biology وفهرستها بنجاح كمصدر واحد.
5. تشغيل Analyze topics بنجاح؛ تم إنشاء 5 Topics مع مراجع `Text section 1`.
6. تشغيل توليد Flashcards؛ أظهر API خمس بطاقات محفوظة.
7. نجح توليد أسئلة Full Mock من AI بعد إصلاح source references، لكن محاولة الحفظ فشلت قبل إصلاح اسم عمود `status`، ثم نُشر الإصلاح الأخير.
8. نجحت فحوص TypeScript والاختبارات والبناء بعد الإصلاح الأخير.

## الفحوص البرمجية الأخيرة

عند `4c0b173`:

- `pnpm check` — ناجح.
- `pnpm test --run` — ناجح: 13 ملف اختبار، 44 اختبارًا.
- `pnpm build` — ناجح؛ تحذيرا Vite المعروفان لا يمنعان البناء.
- `git diff --check` — ناجح.

## ما بقي ويجب أن يبدأ به الحساب الجديد

### أولوية 1 — تهيئة الحساب والقاعدة

1. استيراد أحدث `main` إلى مشروع WebDev جديد.
2. تفعيل Server وDatabase وManus Service API/AI وStorage؛ فعّل Speech فقط عند اختبار الصوت.
3. ضبط `STUDYNIVO_SESSION_SECRET` جديد عشوائي لا يقل عن 32 حرفًا عبر Secrets.
4. تشغيل `pnpm install --frozen-lockfile` ثم `pnpm db:migrate` على قاعدة الحساب الجديد.
5. تشغيل الخادم من Terminal/جلسة WebDev المرتبطة بالمشروع حتى تُحقن متغيرات Manus.

### أولوية 2 — اختبار E2E بعد آخر إصلاح

بحساب QA جديد وملف TXT صغير:

`إنشاء الحساب → إنشاء Subject → رفع TXT → انتظار indexed → Analyze topics → Ask Material → توليد Flashcards → Practice → Full Mock → اختيار إجابة وثقة → إكمال الاختبار → إعادة تحميل التقرير → Review Me → جلسة دراسة → Progress.`

يجب تحديد نجاح كل خطوة، خصوصًا:

- التأكد أن `workspace.createQuiz` يحفظ المحاولة بعد إصلاح عمود `status`.
- التأكد أن Practice وFull Mock يظهران السؤال والخيارات فقط أثناء المحاولة، ولا يكشفان answer/explanation/score حتى الإكمال.
- الإجابة عن سؤال واحد ثم إعادة التحميل واستعادة الحالة والتقرير من الخادم.
- اختبار Ask Material بإجابة grounded ومصدر، وسلوك نقص السياق.
- مراجعة بطاقة Flashcard وتحقق تحديث confidence/interval/mistakeCount.
- اختبار ownership بحسابين مختلفين.

### أولوية 3 — إكمال اللغة والواجهة

دقّق كل النصوص الظاهرة في كل لغة من اللغات الـ14، لا العربية فقط. في آخر فحص ظهرت داخل الواجهة العربية نصوص إنجليزية مثل `Home`, `Subjects`, `Study plan`, `Review me`, `Progress`, `Saved items` وبعض نصوص Dashboard/Materials. راجع:

- `client/src/i18n.ts`
- `client/src/i18n.generated.ts`
- `client/src/i18n.test.ts`
- النصوص المباشرة في `client/src/App.tsx` والمكونات

أضف اختبارات تمنع fallback غير المقصود إلى الإنجليزية، واختبر RTL والمظهر الفاتح/الداكن.

### أولوية 4 — النشر

بعد نجاح الفحوص وE2E فقط:

1. احفظ checkpoint في مشروع الحساب الجديد.
2. انشر المشروع الجديد فقط.
3. اختبر الرابط المنشور من `/api/health` والواجهة وتسجيل الدخول.
4. سجّل الرابط الجديد في هذه الوثيقة، ولا تقل إن الرابط القديم تغير.

## تشغيل سريع

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test --run
pnpm build
pnpm db:migrate
pnpm dev
```

تحقق من:

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:3000/manus-routes.json
```

المتوقع: `{"status":"ok"}` وJSON routes، وليس HTML fallback.

## أخطاء واجهناها وكيف نتجنبها

- `Database is not available`: الخادم شُغّل من Terminal غير مرتبط ولم يرَ متغيرات Manus. أعد تشغيله من Terminal المشروع المرتبط، ولا تغيّر الكود لهذا السبب.
- `Cross-origin request rejected`: كان CSRF يقارن Origin العام بـHost داخلي. الإصلاح موجود في `server/_core/csrf.ts`؛ لا تحذفه ولا تعطل الحماية.
- `INVALID_AI_QUIZ`: كان sourceRef المرسل للاختبار لا يطابق مراجع Topics. الإصلاح موجود في `server/ai/quizGeneration.ts`.
- فشل حفظ `quiz_attempts`: كان schema يستخدم اسم عمود `quiz_status` بينما migration أنشأت `status`. الإصلاح موجود في `drizzle/schema.ts`؛ شغّل migrations على قاعدة جديدة قبل الاختبار.
- تحذير Vite عن `/api/platform/config.js` وحجم bundle أكبر من 500 kB معروفان وغير مانعين حاليًا.

## سياسة Git والأسرار

- اعمل على `main` مع `git fetch` ودمج fast-forward عند الحاجة.
- لا تستخدم `force-push`، ولا تحذف ملفات أو migrations.
- لا تضع `.env` أو `DATABASE_URL` أو `STUDYNIVO_SESSION_SECRET` أو مفاتيح Manus في GitHub.
- بعد أي تعديل: `pnpm check`, `pnpm test --run`, `pnpm build`, `git diff --check`.
- حدّث هذه الوثيقة و`docs/PROMPT_FOR_NEW_MANUS_ACCOUNT.md` عند تغير الحالة.
