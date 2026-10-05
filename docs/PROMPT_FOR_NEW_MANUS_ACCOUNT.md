# نص جاهز للصقه في حساب Manus الجديد

واصل تطوير مشروع **StudyNivo** من مستودع GitHub الخاص:

```text
https://github.com/mojtabahamed163-ai/studynivo-ai-study-coach
```

استخدم الفرع `main` وآخر HEAD. اقرأ أولًا:

1. `docs/TRANSFER_TO_NEW_MANUS_ACCOUNT.md` — الوثيقة المرجعية الحالية.
2. `MANUS_SETUP.md` — إعداد وتشغيل المشروع.
3. `docs/NEW_MANUS_ACCOUNT_CHECKLIST.md` — فحوص الحساب الجديد.
4. `docs/PROJECT_HANDOFF.md` — الخلفية التقنية والتاريخ.
5. `docs/PLAN.md` و`docs/برومبت.txt` — الخطة والمواصفة الأصلية.

## تعليمات مهمة

- أنشئ مشروع WebDev جديدًا مملوكًا لهذا الحساب من GitHub، مع Server وDatabase.
- لا تحاول ربط مشروع Manus القديم أو Resource URI قديم.
- GitHub ينقل الشيفرة والوثائق فقط؛ أنشئ Database وSecrets وخدمات Manus من جديد.
- لا تطلب من المستخدم إرسال أي كلمة مرور أو API key في الدردشة.
- لا تضع `.env` أو `DATABASE_URL` أو `STUDYNIVO_SESSION_SECRET` أو مفاتيح Manus في GitHub.
- لا تحذف migrations أو تعيد تسميتها، ولا تستخدم force-push.

## الحالة الحالية

آخر commit في GitHub هو `24e3e69`، وآخر إصلاح مهم يجعل إنشاء الحساب يسجّل الدخول تلقائيًا. الفحوص الأخيرة ناجحة: `pnpm check`، و47 اختبارًا، و`pnpm build`.

المشروع يحتوي على المصادقة، المواد، رفع الملفات، الفهرسة، Topics grounded، Ask Material، البحث، Flashcards، Practice، Full Mock، Review Me، جلسات الدراسة، Progress، 14 لغة، RTL وLight/Dark.

## نفّذ الآن

1. جهّز مشروع WebDev جديدًا وفعّل Server وDatabase وManus AI/Storage.
2. أنشئ `STUDYNIVO_SESSION_SECRET` جديدًا عشوائيًا بطول 32+ حرفًا عبر Secrets.
3. شغّل:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test --run
pnpm build
pnpm db:migrate
pnpm dev
```

4. تحقق من `/api/health` و`/manus-routes.json`.
5. نفّذ E2E كاملًا: إنشاء حساب → Subject → TXT/PDF → indexed → Analyze topics → Ask Material → Flashcards → Practice → Full Mock → إكمال → reload → Review Me → Study Session → Progress.
6. تحقق من ownership بحسابين، ومن عدم كشف إجابات Full Mock قبل الإكمال.
7. راجع العربية RTL وLight/Dark، ثم شغّل الفحوص مرة أخرى.
8. حدّث `docs/TRANSFER_TO_NEW_MANUS_ACCOUNT.md` بالحالة والرابط الجديد، ثم احفظ checkpoint وانشر مشروع الحساب الجديد فقط.

إذا وجدت تعارضًا بين وثيقة تاريخية وهذه الرسالة، فالأولوية لآخر كود على `main` ثم `docs/TRANSFER_TO_NEW_MANUS_ACCOUNT.md`.
