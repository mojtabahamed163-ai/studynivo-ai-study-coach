# نص جاهز للصقه في حساب Manus الجديد

واصل مشروع **StudyNivo** من مستودع GitHub الخاص:

`https://github.com/mojtabahamed163-ai/studynivo-ai-study-coach`

استخدم الفرع `main` وآخر `HEAD`. اقرأ هذه الملفات أولًا:

1. `docs/HANDOFF_FOR_NEW_MANUS_ACCOUNT.md`
2. `MANUS_SETUP.md`
3. `docs/PROJECT_HANDOFF.md`
4. `docs/PLAN.md`

## قيود مهمة

- أنشئ مشروع WebDev جديدًا مملوكًا لهذا الحساب من مستودع GitHub نفسه، مع Server وDatabase؛ لا تحاول ربط Resource URI أو مشروع Manus قديم.
- لا تنشئ قالبًا جديدًا، ولا تحذف ملفًا أو migration، ولا تستخدم الموقع القديم `https://studynivo-ns7gtcfg.manus.space` كهدف للنشر.
- GitHub لا ينقل قاعدة البيانات أو أسرار Manus؛ أنشئ Database وSecrets جديدة في هذا الحساب.
- لا تطلب كلمة مرور أو API key في الدردشة، ولا تضع أي سر في GitHub.

## الحالة الدقيقة

StudyNivo تطبيق ويب كامل للدراسة الشخصية: مصادقة، Subjects، Materials، فهرسة نصوص وملفات، Topics grounded، Ask Material، Flashcards، Practice، Full Mock، Review Me، جلسات دراسة، Progress، لغات متعددة، RTL ومظهر فاتح/داكن.

نجح سابقًا: تسجيل الدخول العام بعد إصلاح CSRF، إنشاء Subject، فهرسة ملاحظات TXT، Analyze topics وإنشاء 5 Topics، توليد 5 Flashcards، وفحوص الكود. أُصلحت قبل التوقف ثلاث مشاكل مهمة:

- CSRF خلف البروكسي في `server/_core/csrf.ts` باستخدام `X-Forwarded-Host`.
- مراجع مصادر الاختبار في `server/ai/quizGeneration.ts` لتطابق `Text section N`.
- اسم عمود حالة الاختبار في `drizzle/schema.ts` ليتطابق مع قاعدة البيانات (`status`).

آخر فحوص الكود قبل هذا التسليم: `pnpm check` ناجح، `pnpm test --run` ناجح (44 اختبارًا)، و`pnpm build` ناجح.

## نفّذ الآن بالترتيب

1. فعّل Server وDatabase وManus Service API/AI وStorage، وSpeech عند اختبار الصوت.
2. اضبط `STUDYNIVO_SESSION_SECRET` بسر جديد عشوائي لا يقل عن 32 حرفًا عبر Secrets.
3. من جذر المشروع نفّذ:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test --run
pnpm build
pnpm db:migrate
pnpm dev
```

شغّل `pnpm dev` من Terminal/جلسة WebDev المرتبطة بالمشروع؛ إذا ظهر `Database is not available` لا تغيّر الكود، بل أعد تشغيل الخادم من الجلسة الصحيحة.

4. نفّذ E2E بحساب QA جديد: إنشاء حساب → Subject → رفع TXT → indexed → Analyze topics → Ask Material → Flashcards → Practice → Full Mock → إجابة وثقة → إكمال → reload واستعادة التقرير → Review Me → جلسة دراسة → Progress.
5. تحقق أن الاختبار لا يكشف الإجابة أو الشرح أو الدرجة قبل الإكمال، وأن `workspace.createQuiz` يحفظ المحاولة.
6. دقّق الواجهة بكل اللغات الـ14. بقيت في آخر فحص تسميات إنجليزية داخل الواجهة العربية مثل `Home`, `Subjects`, `Study plan`, `Review me`, `Progress`, `Saved items` وبعض Dashboard/Materials. أصلح جميع اللغات، لا العربية فقط، وأضف اختبارات fallback.
7. أعد check/test/build و`git diff --check`، حدّث handoff، ثم ادفع إلى `main` بلا force-push.
8. بعد نجاح كل ذلك انشر **مشروع الحساب الجديد فقط**، واختبر الرابط الجديد، وسجله في handoff. لا تدّعِ أن الموقع القديم تغيّر.

إذا وجدت تعارضًا بين وثيقة تاريخية وهذه الرسالة، فالأولوية لـ`docs/HANDOFF_FOR_NEW_MANUS_ACCOUNT.md` ثم لأحدث الكود على `main`.
