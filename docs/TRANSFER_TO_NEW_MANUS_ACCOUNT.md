# StudyNivo — وثيقة الانتقال الكاملة إلى حساب Manus جديد

> **هذه هي الوثيقة المرجعية الأساسية.** اقرأها أولًا عند فتح حساب Manus جديد، ثم اقرأ `MANUS_SETUP.md` و`docs/NEW_MANUS_ACCOUNT_CHECKLIST.md`.

## 1. معلومات المشروع

- **اسم المشروع:** StudyNivo — Your Personal AI Study Coach
- **مستودع GitHub:** https://github.com/mojtabahamed163-ai/studynivo-ai-study-coach
- **الفرع:** `main`
- **آخر commit في GitHub:** `24e3e69` — `fix: sign users in after registration`
- **المسار المحلي في البيئة الحالية:** `/home/ubuntu/studynivo-ai-study-coach`
- **التقنيات:** React 19 + Vite + TypeScript، Express، tRPC، Drizzle ORM، MySQL، Tailwind CSS

## 2. ما هو StudyNivo؟

تطبيق مساعد دراسة شخصي مدعوم بالذكاء الاصطناعي. ينشئ الطالب مساحات مستقلة للمواد، يضيف ملاحظات أو يرفع ملفات، يفهرس التطبيق المحتوى، يستخرج موضوعات مرتبطة بالمصادر، ثم يوفر:

- Ask Material بإجابات grounded في مصادر المادة.
- Analyze topics لاستخراج الموضوعات ومراجعها.
- بحثًا داخل المصادر المفهرسة.
- Flashcards محفوظة مع مراجعة متباعدة.
- Practice Test وFull Mock Exam محفوظين في قاعدة البيانات.
- Review Me للأخطاء والبطاقات المستحقة.
- Study Manager وخطة دراسة تراعي الامتحانات والوقت ونقاط الضعف.
- جلسات دراسة مع إيقاف واستئناف وتقدم.
- 14 لغة، RTL للعربية، ومظهر فاتح/داكن.

## 3. الحالة الحالية الدقيقة

### مكتمل في الكود

- المصادقة بالبريد الإلكتروني أو الهاتف مع كلمة مرور.
- كلمة المرور تظهر افتراضيًا، والحد الأدنى 8 أحرف أو أرقام.
- إنشاء الحساب يسجل دخول المستخدم تلقائيًا بعد نجاح الإنشاء في آخر إصلاح `24e3e69`.
- جلسات موقعة، إبطال جلسات، وrate limiting.
- حماية CSRF/Origin تعمل خلف البروكسي باستخدام `X-Forwarded-Host`.
- ownership checks على المستخدم والـsubject والمصادر والموضوعات والاختبارات.
- رفع PDF وDOCX وTXT/Markdown والصور والصوت، مع التحقق من النوع والحجم وmagic bytes وhash.
- PDF عبر `pdf-parse`، DOCX عبر `mammoth`، الصور عبر OCR/AI، والصوت عبر Speech transcription عند تفعيل الخدمة.
- حالات المواد: `queued`, `extracting`, `indexing`, `indexed`, `needs_review`, `failed`.
- AI grounded لا يفترض معلومات خارج مصادر المادة.
- Topics، بحث، حفظ مصادر/عناصر، بطاقات، اختبارات، جلسات، تقدم وإعدادات.
- migrations من `0000` إلى `0009` موجودة ومتعقبة.
- إصلاح تطابق عمود `quiz_attempts.status` مع migration.
- إصلاح مراجع الاختبارات لتطابق `Text section N`.
- تدقيق واسع للترجمة العربية وإزالة التسربات الإنجليزية الشائعة في الواجهة، مع اختبار يمنع fallback في المسارات الرئيسية.
- `client/public/manus-routes.json` متزامن مع المسارات.

### آخر تحقق برمجي

في آخر تشغيل داخل المشروع:

```text
pnpm check       ناجح
pnpm test --run  ناجح: 13 ملفًا / 47 اختبارًا
pnpm build       ناجح
 git diff --check ناجح
```

يوجد تحذيران غير مانعين معروفان في البناء:

1. تحذير Vite حول `/api/platform/config.js` وغياب `type="module"`.
2. تحذير bundle أكبر من 500 kB.

### النشر الحالي

- آخر نشر مستقر مؤكد قبل إصلاح التسجيل: checkpoint `81f2849`.
- إصلاح التسجيل الأخير checkpoint/commit WebDev: `690579223c79d2ac2efd919eb9ac35ad73911794`، وكان في حالة `deploying` عند آخر تحقق في 2026-10-05.
- رابط المعاينة الحالي للبيئة السابقة: https://8328-i6f0ibgv7qdljd69foryp-3b8e4b8f.us4.manus.computer
- `/api/health` كان يعيد `{"status":"ok"}`.
- **لا تعتمد على مشروع Manus القديم عند فتح الحساب الجديد.** أنشئ مشروع WebDev جديدًا من GitHub وانشره بعد الفحوص.

## 4. ما الذي ينتقل عبر GitHub وما الذي لا ينتقل؟

### ينتقل عبر المستودع

- كل الشيفرة المصدرية.
- كل migrations وschema.
- اختبارات الخادم والعميل.
- `pnpm-lock.yaml` و`package.json` وDockerfile.
- route manifest.
- خطط التصميم والمواصفات ووثائق التسليم.
- سجل Git الكامل في مستودع GitHub.

### لا ينتقل عبر GitHub ويجب إنشاؤه من جديد

- قاعدة البيانات وبيانات المستخدمين والمواد القديمة.
- أسرار Manus و`DATABASE_URL`.
- مشروع WebDev أو Resource URI أو نطاق النشر القديم.
- صلاحيات الخدمات وStorage وAI وSpeech.
- جلسات تسجيل الدخول الحالية.

لا تحاول نسخ هذه القيم إلى GitHub أو الدردشة، ولا تطلب من المستخدم إرسالها في الرسائل.

## 5. خطوات الحساب الجديد بالترتيب

1. استورد المستودع الخاص من:
   `https://github.com/mojtabahamed163-ai/studynivo-ai-study-coach`
2. استخدم الفرع `main` وآخر HEAD.
3. أنشئ مشروع WebDev جديدًا مملوكًا للحساب الجديد، بنوع Web / Server-enabled.
4. فعّل Server وDatabase وManus Service API/AI وStorage. فعّل Speech فقط عند اختبار الصوت.
5. أنشئ سرًا جديدًا عشوائيًا باسم `STUDYNIVO_SESSION_SECRET` بطول 32 حرفًا أو أكثر عبر Secrets.
6. من جذر المشروع شغّل:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test --run
pnpm build
pnpm db:migrate
pnpm dev
```

7. شغّل الخادم من Terminal المرتبط بمشروع WebDev، حتى يرى متغيرات Manus.
8. تحقق من:

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:3000/manus-routes.json
```

المتوقع من health هو `{"status":"ok"}`، ويجب أن يكون routes JSON وليس HTML.

## 6. اختبار E2E المطلوب قبل النشر

استخدم حساب QA جديدًا وملف TXT صغيرًا، ونفذ هذا المسار:

```text
إنشاء حساب
→ تسجيل الدخول تلقائيًا
→ إنشاء Subject
→ لصق ملاحظات أو رفع TXT
→ انتظار indexed
→ Analyze topics
→ Ask Material
→ Generate Flashcards
→ Practice Test
→ Full Mock Exam
→ اختيار إجابة وثقة
→ إكمال الاختبار
→ إعادة تحميل التقرير
→ Review Me
→ بدء/إيقاف/إكمال Study Session
→ Progress
```

يجب التحقق من الآتي:

- إنشاء الحساب ينجح ولا يظهر رفض Origin.
- تسجيل الدخول بالبريد والهاتف يعملان.
- كلمة السر الأقل من 8 أحرف تُرفض برسالة واضحة.
- رفع TXT وPDF يعملان حتى `indexed`.
- Topics تحتوي على `sourceRef` صحيح.
- Ask Material يجيب من المصدر فقط ويذكر نقص السياق عند الحاجة.
- البطاقات تُحفظ وتتغير `confidence` و`interval` و`mistakeCount`.
- Practice وFull Mock يستعيدان المحاولة بعد reload.
- لا تظهر الإجابة الصحيحة أو الشرح أو الدرجة أثناء المحاولة النشطة.
- Report يظهر بعد الإكمال فقط.
- ownership يمنع مستخدمًا من قراءة مادة مستخدم آخر.
- RTL العربية يعمل في Light وDark دون تجاوز أفقي.

## 7. قواعد العمل للحساب الجديد

- اعمل على `main`، ولا تستخدم `force-push`.
- لا تحذف migrations ولا تعيد تسميتها.
- بعد كل تعديل شغّل `pnpm check`, `pnpm test --run`, `pnpm build`, و`git diff --check`.
- حدّث هذه الوثيقة إذا تغيرت الحالة أو أضيفت إصلاحات.
- لا تضف `.env` أو `DATABASE_URL` أو API keys أو session secrets إلى GitHub.
- أبقِ حماية CSRF وownership checks مفعلة.
- أبقِ كل إجابات AI grounded في مصادر المادة.
- بعد نجاح E2E احفظ checkpoint وانشر مشروع الحساب الجديد فقط، ثم سجّل الرابط الجديد هنا.

## 8. الأعمال التالية المقترحة

1. التأكد من اكتمال نشر `6905792` أو إعادة نشره من مشروع الحساب الجديد.
2. تنفيذ E2E الكامل على قاعدة جديدة.
3. تدقيق النصوص الثانوية في مكونات UI غير المستخدمة على المسارات الأساسية.
4. تحسين retrieval الدلالي بدل إعادة تقسيم النص عند البحث.
5. تحسين توليد البطاقات من chunks مباشرة.
6. تقييم أوزان Study Manager على بيانات فعلية.
7. إضافة اختبارات تكامل آلية لمسار التسجيل ورفع الملفات والاختبارات المحفوظة.
8. حفظ locale للمستخدم في `userProfiles` مع الاعتماد الأقل على `localStorage`.

## 9. نقطة البداية العملية للوكيل الجديد

ابدأ بهذا الترتيب:

```text
اقرأ docs/TRANSFER_TO_NEW_MANUS_ACCOUNT.md
ثم MANUS_SETUP.md
ثم docs/NEW_MANUS_ACCOUNT_CHECKLIST.md
ثم افحص git log وgit status
ثم شغّل check/test/build
ثم جهّز WebDev جديدًا وقاعدة جديدة
ثم نفّذ E2E قبل أي نشر
```
