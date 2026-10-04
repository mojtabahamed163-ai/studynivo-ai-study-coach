# StudyNivo — دليل إعداد حساب Manus جديد

اقرأ أولًا `docs/HANDOFF_FOR_NEW_MANUS_ACCOUNT.md` ثم `docs/PROMPT_FOR_NEW_MANUS_ACCOUNT.md` و`docs/NEW_MANUS_ACCOUNT_CHECKLIST.md`.

## 1. الاستيراد

استورد المستودع الخاص:

`https://github.com/mojtabahamed163-ai/studynivo-ai-study-coach`

من الفرع `main` إلى **مشروع WebDev جديد** في حساب Manus الجديد. لا تربط Resource URI لمشروع قديم، ولا تنشئ قالبًا فارغًا. GitHub ينقل الشيفرة والوثائق فقط، لا قاعدة البيانات أو الأسرار.

اختر Web / Server-enabled، فعّل Server وDatabase، واضبط runtime على المنفذ 3000 إذا طلبت المنصة ذلك. أبقِ النشر التلقائي مغلقًا حتى نجاح الفحوص وE2E.

## 2. الخدمات والأسرار

فعّل Manus Database وManus Service API/AI وStorage. فعّل Speech عند اختبار الصوت فقط. اضبط `STUDYNIVO_SESSION_SECRET` جديدًا عشوائيًا لا يقل عن 32 حرفًا عبر آلية Secrets. لا تنسخ `DATABASE_URL` أو مفاتيح Manus من أي مشروع آخر.

المتغيرات المدارة الأساسية: `DATABASE_URL`, `STUDYNIVO_SESSION_SECRET`, `MANUS_API_URL`, `MANUS_API_KEY`, `MANUS_PROJECT_ID`, و`PORT`.

## 3. التثبيت والترحيلات والتشغيل

من جذر المشروع:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test --run
pnpm build
pnpm db:migrate
pnpm dev
```

شغّل الخادم من Terminal/جلسة WebDev المرتبطة حتى تُحمّل متغيرات Manus. إذا ظهر `Database is not available`، أعد تشغيل الخادم من الجلسة الصحيحة؛ لا تغيّر الكود لإخفاء المشكلة.

تحقق:

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:3000/manus-routes.json
```

## 4. الإصلاحات التي يجب الحفاظ عليها

- `server/_core/csrf.ts`: يستخدم `X-Forwarded-Host` خلف البروكسي؛ لا تعطل same-origin protection.
- `server/ai/quizGeneration.ts`: يستخدم `Text section N` كمصدر للاختبار حتى يطابق Topics.
- `drizzle/schema.ts`: `quiz_attempts.status` يطابق عمود migration الحالي `status`.
- `client/public/manus-routes.json`: يجب أن يبقى متزامنًا مع المسارات.

## 5. الاختبار والنشر

نفّذ E2E الكامل الموجود في `docs/NEW_MANUS_ACCOUNT_CHECKLIST.md`. ركّز على حفظ Full Mock وإعادة تحميل التقرير ومنع تسريب الإجابات قبل الإكمال. دقّق نصوص اللغات الـ14؛ في آخر فحص بقيت بعض تسميات Dashboard/Materials بالإنجليزية داخل العربية.

بعد نجاح check/test/build وE2E فقط: احفظ checkpoint في مشروع الحساب الجديد، انشره، اختبر الرابط الجديد، وسجله في handoff. لا تنشر إلى الموقع القديم.
