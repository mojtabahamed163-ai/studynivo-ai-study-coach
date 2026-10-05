# StudyNivo — الحالة والمهام للحساب الجديد

المرجع الكامل: `docs/TRANSFER_TO_NEW_MANUS_ACCOUNT.md`.

## مكتمل في GitHub

- [x] React/Vite/TypeScript + Express/tRPC + Drizzle/MySQL.
- [x] Server routes وownership checks وrate limiting وإبطال الجلسات.
- [x] مصادقة البريد/الهاتف وكلمة مرور 8–128 حرفًا.
- [x] إنشاء الحساب يسجل الدخول تلقائيًا بعد نجاح التسجيل.
- [x] إصلاح CSRF/Origin خلف البروكسي.
- [x] Subjects وMaterials ورفع PDF/DOCX/TXT/Markdown/صور/صوت.
- [x] معالجة وفهرسة المواد وRetry وsource references.
- [x] Analyze topics وAsk Material والبحث grounded.
- [x] Flashcards محفوظة ومراجعة متباعدة.
- [x] Practice وFull Mock محفوظان مع الإجابات والثقة والتقرير.
- [x] Review Me وStudy Manager وStudy Sessions وProgress.
- [x] 14 لغة وRTL للعربية وLight/Dark.
- [x] migrations من `0000` إلى `0009`.
- [x] route manifest وDockerfile و`.env.example` الآمن.
- [x] آخر فحوص: 47 اختبارًا، TypeScript، build، وgit diff check.

## مطلوب عند إنشاء حساب Manus جديد

- [ ] استيراد `main` من GitHub إلى مشروع WebDev جديد.
- [ ] تفعيل Server وDatabase وManus AI/Storage، وSpeech عند الحاجة.
- [ ] إنشاء `STUDYNIVO_SESSION_SECRET` جديد عبر Secrets.
- [ ] تثبيت الاعتماديات وتشغيل migrations والفحوص.
- [ ] تشغيل E2E كامل بقاعدة وحساب QA جديدين.
- [ ] حفظ checkpoint جديد ونشر المشروع الجديد فقط.
- [ ] تحديث `docs/TRANSFER_TO_NEW_MANUS_ACCOUNT.md` بالرابط الجديد وحالة النشر.

## تحسينات لاحقة اختيارية

- [ ] تحسين retrieval الدلالي والفهرسة المنفصلة.
- [ ] تحسين توليد البطاقات مباشرة من chunks.
- [ ] إضافة اختبارات تكامل آلية لمسار التسجيل والرفع والاختبارات.
- [ ] تقييم أوزان Study Manager على بيانات فعلية.
- [ ] حفظ locale دائمًا في `userProfiles` وتقليل الاعتماد على localStorage.
- [ ] تدقيق النصوص الثانوية في مكونات UI غير المستخدمة في المسارات الأساسية.

## قواعد

- لا تضع أسرارًا أو `.env` أو `DATABASE_URL` في GitHub.
- لا تستخدم force-push ولا تحذف migrations.
- بعد كل تعديل: `pnpm check && pnpm test --run && pnpm build && git diff --check`.
