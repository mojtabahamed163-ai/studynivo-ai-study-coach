# StudyNivo — إعداد حساب Manus جديد

> **ابدأ بقراءة:** `docs/TRANSFER_TO_NEW_MANUS_ACCOUNT.md` ثم `docs/NEW_MANUS_ACCOUNT_CHECKLIST.md`.

## المستودع

```text
https://github.com/mojtabahamed163-ai/studynivo-ai-study-coach
```

استخدم الفرع `main` وآخر HEAD. أنشئ مشروع WebDev جديدًا من GitHub؛ لا تربط Resource URI قديمًا ولا تنشئ قالبًا فارغًا.

## الخدمات المطلوبة

فعّل في مشروع الحساب الجديد:

- Web / Server-enabled
- Server
- Database
- Manus Service API / AI
- Storage
- Speech فقط عند اختبار الملفات الصوتية

أنشئ Secret جديدًا باسم `STUDYNIVO_SESSION_SECRET`، عشوائيًا وبطول 32 حرفًا أو أكثر. أضف أيضًا `BREVO_API_KEY` و`BREVO_FROM_EMAIL` عبر Secrets فقط إذا أردت تفعيل استعادة كلمة المرور بالبريد؛ يجب أن يكون المرسل موثقًا في Brevo. لا تنسخ أي Secret أو `DATABASE_URL` من حساب آخر، ولا تضعها في GitHub.

## التشغيل

من جذر المستودع:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test --run
pnpm build
pnpm db:migrate
pnpm dev
```

شغّل `pnpm dev` من Terminal المرتبط بمشروع WebDev حتى تُحقن متغيرات Manus. إذا ظهر `Database is not available`، أعد تشغيل الخادم من الجلسة المرتبطة بدل تعديل الكود.

## التحقق

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:3000/manus-routes.json
```

المتوقع:

```json
{"status":"ok"}
```

وJSON routes صالح، وليس HTML fallback.

## إصلاحات لا يجوز حذفها

- `server/_core/csrf.ts`: يقارن Origin مع `X-Forwarded-Host` خلف البروكسي.
- `server/_core/customAuth.ts`: جلسات موقعة، كلمة مرور 8–128، rate limiting وإبطال الجلسات.
- `client/src/App.tsx`: إنشاء الحساب يسجل الدخول تلقائيًا بعد نجاح الإنشاء.
- `server/ai/quizGeneration.ts`: مراجع الأسئلة تطابق `Text section N`.
- `drizzle/schema.ts`: عمود `quiz_attempts.status` مطابق للـmigration.
- `drizzle/0010_black_killraven.sql`: جدول رموز استعادة كلمة المرور additive ولا يجوز تخطيه.
- `server/_core/email.ts`: إرسال استعادة كلمة المرور عبر Brevo API، ولا تستبدل الأسرار بقيم داخل الكود.
- `client/public/manus-routes.json`: حدّثه عند إضافة أي مسار.

## قبل النشر

نفّذ قائمة E2E في `docs/TRANSFER_TO_NEW_MANUS_ACCOUNT.md`، خصوصًا إنشاء الحساب، رفع TXT/PDF، الفهرسة، AI، Practice، Full Mock، reload، ownership، والعربية RTL. بعد نجاحها فقط احفظ checkpoint وانشر مشروع الحساب الجديد، ثم سجّل الرابط الجديد في وثيقة الانتقال.
