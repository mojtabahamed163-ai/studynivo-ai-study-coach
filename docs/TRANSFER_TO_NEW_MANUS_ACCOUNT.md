# StudyNivo — وثيقة الانتقال إلى حساب Manus جديد

> **اقرأ هذه الوثيقة أولًا عند فتح حساب Manus الجديد.** هذه الوثيقة تصف آخر نسخة محفوظة في GitHub، وما ينتقل وما يجب إنشاؤه من جديد.

## 1. هوية المشروع

- **الاسم:** StudyNivo — Your Personal AI Study Coach
- **مستودع GitHub:** https://github.com/mojtabahamed163-ai/studynivo-ai-study-coach
- **الفرع المعتمد:** `main`
- **المكدس:** React + Vite + TypeScript، Express/tRPC، Drizzle ORM، MySQL، Tailwind CSS
- **اتجاه التصميم:** Calm productivity SaaS، mobile-first، واضح وهادئ، مع RTL للعربية وLight/Dark
- **لغة الواجهة:** 14 لغة، منها العربية

## 2. فكرة التطبيق والميزات

StudyNivo مساعد دراسة شخصي مدعوم بالذكاء الاصطناعي. لكل طالب مساحات مستقلة للمواد، ويستطيع:

- إنشاء المواد وتحديد موعد الامتحان.
- إضافة ملاحظات أو رفع TXT وMarkdown وPDF وDOCX والصور والصوت.
- استخراج النص من PDF وDOCX والصور عبر OCR، وتفريغ الصوت عند تفعيل Speech.
- فهرسة المصادر واستخراج Topics مرتبطة بالمصدر و`sourceRef`.
- سؤال المادة بإجابات grounded داخل مصادر المادة فقط.
- البحث داخل المصادر المفهرسة.
- إنشاء Flashcards محفوظة مع `confidence` و`interval` و`mistakeCount` ومراجعة متباعدة.
- Practice Test وFull Mock Exam محفوظين ويمكن استعادتهما بعد إعادة التحميل.
- Review Me للأخطاء والبطاقات المستحقة.
- Study Manager يراعي موعد الامتحان ونقاط الضعف والثقة والوقت المتاح.
- Study Sessions مع إيقاف واستئناف وإكمال وتقدم.
- مظهر فاتح وداكن يمكن تغييره من أي صفحة.
- اختيار اللغة من زر الكرة الأرضية `🌐`، مع دعم الهاتف وRTL.
- بريد دعم المستخدمين: `studynivo@outlook.com`.

## 3. آخر حالة برمجية

آخر نسخة من كود WebDev المنشورة قبل نقلها إلى GitHub كانت checkpoint/commit:

```text
590f1c16030054093b9357d62819f64a4011b0f2
```

وتتضمن آخر تحسين مهم لتحليل الصور:

- تحليل دفعات النص بالتوازي المحدود بدلًا من تنفيذها بالتتابع.
- حد التوازي ثلاث دفعات حتى لا يتم إغراق خدمة الذكاء الاصطناعي.
- تعطيل زر **Analyze topics** أثناء الطلب لمنع الطلبات المكررة.
- إظهار حالة **Analyzing topics… / جارٍ تحليل الموضوعات…**.

تتضمن نسخة GitHub أيضًا الإصلاحات المتراكمة التالية:

- إصلاح الترجمة وتحديثها دون الحاجة إلى Pull-to-Refresh.
- إصلاح التاريخ والتقويم وفق المنطقة الزمنية المحلية للمستخدم.
- إظهار تبديل Light/Dark في كل الصفحات.
- قائمة اللغة `🌐` متجاوبة على الهاتف وRTL.
- رسائل واضحة عند تكرار البريد أو رقم الهاتف بدل رسالة كلمة مرور خاطئة.
- جلسات موقعة، إبطال الجلسات، rate limiting، وحماية CSRF/Origin خلف البروكسي.
- ownership checks لكل مستخدم وSubject وMaterial وTopic وQuiz.
- استعادة كلمة المرور برمز أحادي الاستخدام مخزن كـhash فقط، مع migration `drizzle/0010_black_killraven.sql`.
- استخدام Brevo API لإرسال بريد استعادة كلمة المرور في الكود الموجود على GitHub.
- بطاقة دعم داخل Settings ورابط دعم من شاشة الدخول.

## 4. البريد واستعادة كلمة المرور

طبقة البريد الحالية في GitHub تستخدم Brevo API من خلال:

```text
BREVO_API_KEY
BREVO_FROM_EMAIL
```

أضف القيم من خلال Secrets في مشروع WebDev الجديد، وليس داخل الملفات أو GitHub. يجب أن يكون عنوان `BREVO_FROM_EMAIL` مرسلًا مسموحًا به ومتحققًا في Brevo. لا توجد أي قيمة سرية في المستودع.

رسائل استعادة كلمة المرور:

- لا تكشف ما إذا كان البريد موجودًا أم لا، لتجنب كشف الحسابات.
- تستخدم رمزًا عشوائيًا أحادي الاستخدام.
- تخزن hash الرمز فقط.
- تنتهي صلاحية الرابط بعد 15 دقيقة.
- تمنع استهلاك الرمز مرتين حتى في الطلبات المتوازية.
- تحتاج `BREVO_API_KEY` و`BREVO_FROM_EMAIL` كي تصل الرسائل فعليًا.

إذا لم تُضبط أسرار Brevo في الحساب الجديد، سيبقى تدفق التسجيل وتسجيل الدخول يعملًا، لكن إرسال رسائل استعادة كلمة المرور لن يعمل حتى تفعيلها.

## 5. ما ينتقل عبر GitHub وما لا ينتقل

### ينتقل

- كل الشيفرة المصدرية.
- migrations وschema واختبارات الخادم والعميل.
- `package.json` و`pnpm-lock.yaml` وDockerfile.
- `client/public/manus-routes.json`.
- خطط التصميم والمواصفات وأدلة التشغيل.
- تاريخ Git والـcommits الموجودة في المستودع.

### لا ينتقل ويجب إنشاؤه من جديد

- قاعدة البيانات وبيانات الطلاب والمواد القديمة.
- `DATABASE_URL`.
- `STUDYNIVO_SESSION_SECRET`.
- `BREVO_API_KEY` وبيانات الخدمات الأخرى.
- Resource URI ومشروع WebDev القديم.
- جلسات تسجيل الدخول الحالية وملفات Storage الخاصة بالحساب القديم.

لا تنقل هذه القيم إلى GitHub أو إلى الدردشة.

## 6. إعداد حساب Manus الجديد

1. استورد المستودع الخاص من GitHub:
   `https://github.com/mojtabahamed163-ai/studynivo-ai-study-coach`
2. استخدم الفرع `main` وآخر commit.
3. أنشئ مشروع Web جديد من المستودع، مع Server وDatabase.
4. فعّل Manus AI/Service API وStorage، وفعّل Speech عند اختبار الصوت.
5. أنشئ Secret جديدًا عشوائيًا باسم `STUDYNIVO_SESSION_SECRET`، بطول 32 حرفًا أو أكثر.
6. أضف أسرار البريد:
   - `BREVO_API_KEY`
   - `BREVO_FROM_EMAIL`
7. لا تربط المشروع الجديد بـResource URI قديم ولا تحاول نقل قاعدة البيانات القديمة.

## 7. التشغيل والفحوص

من جذر المستودع:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test --run
pnpm build
pnpm db:migrate
pnpm dev
```

تحقق من الخادم:

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:3000/manus-routes.json
```

المتوقع:

```json
{"status":"ok"}
```

ويجب أن يعيد `manus-routes.json` JSON حقيقيًا وليس صفحة HTML من SPA fallback.

آخر فحوص مؤكدة قبل النقل:

- `pnpm check`: ناجح.
- `pnpm test --run`: ناجح، 13 ملف اختبار و47 اختبارًا.
- `pnpm build`: ناجح.
- `git diff --check`: ناجح.

تحذيرات البناء المعروفة غير المانعة:

- تحذير Vite حول `/api/platform/config.js` و`type="module"`.
- تحذير حجم JavaScript الأكبر من 500 kB.

## 8. اختبار E2E بعد إعداد الحساب الجديد

استخدم حساب QA وبيانات اختبار غير حقيقية:

```text
إنشاء حساب جديد
→ تسجيل الدخول تلقائيًا
→ إنشاء Subject
→ رفع TXT أو PDF صغير
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
→ بدء Study Session
→ إيقاف واستئناف وإكمال الجلسة
→ Progress
```

تحقق من:

- البريد والهاتف يعملان.
- كلمة المرور الأقل من 8 أحرف تُرفض برسالة واضحة.
- تكرار البريد أو الهاتف يعطي رسالة تسجيل مسبق واضحة.
- رفع TXT وPDF يصل إلى `indexed`.
- رفع الصورة يمر بـ`queued` ثم `extracting` ثم `indexing` ثم `indexed` أو `needs_review`.
- Topics تحتوي على `sourceRef` صحيح.
- الإجابات لا تخترع معلومات خارج المصدر وتذكر نقص السياق عند الحاجة.
- البطاقات والاختبارات تحفظ الحالة بعد reload.
- لا تظهر الإجابة الصحيحة أو الشرح أو الدرجة أثناء الاختبار النشط.
- ownership يمنع المستخدم من قراءة بيانات مستخدم آخر.
- العربية RTL تعمل في Light وDark دون تجاوز أفقي على الهاتف.
- رابط استعادة كلمة المرور يصل فقط بعد ضبط Brevo والتحقق من المرسل.

## 9. قواعد العمل

- اعمل على `main`، ولا تستخدم `force-push`.
- لا تحذف migrations ولا تعيد تسميتها.
- بعد كل تعديل شغّل `pnpm check` و`pnpm test --run` و`pnpm build` و`git diff --check`.
- لا تضع `.env` أو `DATABASE_URL` أو مفاتيح API أو session secrets في GitHub.
- أبقِ CSRF وownership checks مفعلة.
- أبقِ إجابات الذكاء الاصطناعي grounded في مصادر الطالب.
- حدّث هذه الوثيقة عند أي تغيير مهم.
- لا تعتبر رابط النشر القديم أو قاعدة الحساب القديم جزءًا من الحساب الجديد؛ أنشئ بيئة جديدة وانشر بعد الفحوص.

## 10. نقطة البداية للوكيل الجديد

اقرأ بالترتيب:

1. `docs/TRANSFER_TO_NEW_MANUS_ACCOUNT.md`
2. `MANUS_SETUP.md`
3. `docs/NEW_MANUS_ACCOUNT_CHECKLIST.md`
4. `docs/PROJECT_HANDOFF.md`
5. `docs/PLAN.md`
6. `docs/برومبت.txt`

ثم نفّذ الفحوص، جهّز Server/Database/AI/Storage/Secrets، وشغّل اختبار E2E قبل أي نشر.
