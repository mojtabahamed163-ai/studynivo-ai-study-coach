# Prompt جاهز لحساب Manus الجديد

واصل تطوير وتشغيل مشروع **StudyNivo — Your Personal AI Study Coach** من مستودع GitHub:

```text
https://github.com/mojtabahamed163-ai/studynivo-ai-study-coach
```

استخدم الفرع `main` وآخر commit. اقرأ أولًا:

1. `docs/TRANSFER_TO_NEW_MANUS_ACCOUNT.md` — المرجع الحالي الكامل.
2. `MANUS_SETUP.md` — إعداد التشغيل.
3. `docs/NEW_MANUS_ACCOUNT_CHECKLIST.md` — قائمة التحقق.
4. `docs/PROJECT_HANDOFF.md` — الخلفية التاريخية، مع إعطاء الأولوية للوثيقة الأولى.
5. `docs/PLAN.md` و`docs/برومبت.txt` — الخطة والمواصفة الأصلية.

## المطلوب

- إنشاء مشروع Web جديد من GitHub مع Server وDatabase.
- تفعيل Manus AI/Service API وStorage، وSpeech عند الحاجة.
- إنشاء `STUDYNIVO_SESSION_SECRET` جديد عشوائيًا بطول 32 حرفًا أو أكثر عبر Secrets.
- إضافة `BREVO_API_KEY` و`BREVO_FROM_EMAIL` عبر Secrets فقط، مع التأكد من أن المرسل موثق في Brevo.
- عدم نقل أو طلب أي كلمة مرور أو API key في الدردشة.
- عدم ربط Resource URI قديم أو قاعدة بيانات قديمة.

## الفحوص

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test --run
pnpm build
pnpm db:migrate
pnpm dev
```

ثم تحقق من `/api/health` و`/manus-routes.json`، ونفّذ اختبار E2E:

```text
إنشاء حساب → Subject → رفع TXT/PDF → indexed → Analyze topics
→ Ask Material → Flashcards → Practice Test → Full Mock Exam
→ إكمال وإعادة تحميل التقرير → Review Me → Study Session → Progress
```

اختبر أيضًا تكرار البريد/الهاتف، كلمة المرور الأقل من 8 أحرف، ownership بين مستخدمين، استعادة كلمة المرور بعد ضبط Brevo، العربية RTL، Light/Dark، والهاتف دون تجاوز أفقي.

## قواعد صارمة

- لا تستخدم `force-push`.
- لا تحذف أو تعيد تسمية migrations.
- شغّل `pnpm check` و`pnpm test --run` و`pnpm build` و`git diff --check` بعد التعديلات.
- لا تضع `.env` أو `DATABASE_URL` أو `STUDYNIVO_SESSION_SECRET` أو مفاتيح Brevo/Manus في GitHub.
- أبقِ CSRF وownership وAI grounding مفعلة.
- بعد نجاح الفحوص وE2E، احفظ checkpoint وانشر مشروع الحساب الجديد فقط، ثم حدّث `docs/TRANSFER_TO_NEW_MANUS_ACCOUNT.md`.
