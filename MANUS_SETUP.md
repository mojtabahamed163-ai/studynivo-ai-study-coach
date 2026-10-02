# StudyNivo — دليل ربط وتشغيل حساب Manus آخر

هذا الملف مخصص للحساب الذي سيستورد مستودع GitHub ويكمل StudyNivo. اقرأه أولًا، ثم اقرأ `docs/PROJECT_HANDOFF.md` و`docs/برومبت.txt`.

## 1. قبل الاستيراد

تأكد أن حساب Manus الآخر يستطيع الوصول إلى مستودع GitHub الخاص:

`https://github.com/mojtabahamed163-ai/studynivo-ai-study-coach`

المستودع **Private**. يجب دعوة حساب GitHub المستخدم في Manus كـcollaborator، أو ربط GitHub Integration في ذلك الحساب بنفس حساب GitHub الذي يملك المستودع. لا ترسل مفاتيح API أو كلمات المرور داخل الدردشة.

يجب استخدام الفرع `main`، وآخر commit حالي هو `bc4df6e`، ويتضمن نسخة الأيقونة المحلية داخل المستودع. لا تنشئ مشروعًا جديدًا من قالب فارغ ولا تنسخ الملفات يدويًا فوق مشروع آخر؛ اربط المستودع نفسه حتى تبقى migrations والتاريخ والوثائق متزامنة.

## 2. استيراد المستودع في Manus

1. افتح حساب Manus الآخر واختر إنشاء/استيراد Web Project من GitHub.
2. اختر المستودع `mojtabahamed163-ai/studynivo-ai-study-coach`.
3. اختر الفرع `main`.
4. إذا طلب Manus نوع المشروع، اختر **Web / Server-enabled**، وليس static-only؛ لأن StudyNivo يستخدم Express/tRPC، قاعدة بيانات، مصادقة، Storage، AI وSpeech.
5. استخدم مجلد المشروع الجذر الذي يحتوي `package.json`, `server/`, `client/`, `drizzle/`, و`Dockerfile`.
6. اضبط runtime الأساسي على المنفذ `3000`، واستعمل listener على `0.0.0.0` في بيئة Cloud/Preview. لا تغيّر المسارات العامة التالية: `/api/health`, `/manus-routes.json`, `/manus-storage/`.
7. لا تفعل النشر التلقائي قبل نجاح الفحوصات الأولية؛ يمكن تفعيله لاحقًا بعد مراجعة النتيجة.

إذا كان حساب Manus يطلب اختيار القدرات، فعّل **Server** و**Database**. Storage وAuthentication وService API/AI يجب أن تكون متاحة من تكاملات Manus. لا تضف Stripe أو Payments؛ المنتج الحالي لا يطلب دفعًا.

## 3. إعداد الأسرار والبيئة

لا توجد قيم أسرار يجب نسخها من GitHub. يجب على حساب Manus الآخر تفعيل/ربط الخدمات من إعدادات المشروع، وسيحمّل Webdev المتغيرات المدارة وقت التشغيل. أهم المتغيرات التي يقرأها الكود هي:

| الغرض | المتغير/المصدر | الملاحظة |
|---|---|---|
| قاعدة البيانات | `DATABASE_URL` | يوفرها Manus Database؛ لا تضع DSN في GitHub. |
| مصادقة الجلسات | `MANUS_JWT_SECRET` | يديرها Manus Authentication/Runtime. |
| Manus OAuth | `MANUS_OAUTH_API_URL` | المسار الحالي هو Manus OAuth. |
| Storage + AI + Speech | `MANUS_API_URL`, `MANUS_API_KEY` | يجب أن تكون من Service API/Storage المدارة، ولا تُنسخ إلى المحادثة. |
| معرف المشروع | `MANUS_PROJECT_ID` | يحقنه Webdev عند ربط المشروع. |
| مالك اختياري | `OWNER_OPEN_ID` | اختياري للـadmin role؛ لا حاجة له للتشغيل الأساسي. |
| منفذ التشغيل | `PORT` | اتركه 3000 في Preview أو احترم المنفذ الذي يحدده Manus. |

إذا كانت خدمة AI أو Speech غير مفعلة، سيظل البناء والفحص ممكنين، لكن Ask Your Material وAnalyze topics ورفع الصوت ستعيد أخطاء خدمة واضحة. لا تستبدلها بمفتاح OpenAI شخصي إلا إذا قرر صاحب المشروع ذلك صراحة؛ العقد الحالي يستخدم Manus built-in AI.

## 4. تثبيت الحزم وتشغيل قاعدة البيانات

من جذر المشروع:

```bash
pnpm install
pnpm check
pnpm db:migrate
```

استخدم `pnpm db:migrate` لتطبيق migrations الموجودة. استخدم `pnpm db:push` فقط عند تعديل `drizzle/schema.ts` وبعد مراجعة migration الناتجة. لا تحذف `drizzle/0000_*` حتى `drizzle/0004_*` ولا تعيد ترتيب ملفات migration.

بعد نجاح قاعدة البيانات:

```bash
pnpm dev
```

أو، إذا كان Manus يطلب تشغيلًا ثابتًا للواجهة فقط، لا تستخدم ذلك للمشروع الكامل إلا للفحص البصري؛ الأمر الصحيح للتطبيق الكامل هو `pnpm dev`.

## 5. فحص الجاهزية

نفّذ بالترتيب:

```bash
pnpm check
pnpm test
pnpm build
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:3000/manus-routes.json
```

النتيجة المتوقعة:

- TypeScript بلا أخطاء.
- الاختبارات الحالية تمر، ومنها اختبارات المصادقة، Speech contract، material analysis، Study Manager وi18n.
- `pnpm build` ينجح. تحذير Vite الخاص بـ`/api/platform/config.js` وتحذير bundle الأكبر من 500 kB معروفان وغير مانعين حاليًا.
- health يعيد `{"status":"ok"}`.
- routes يعيد JSON لا HTML fallback.

بعد ذلك اختبر يدويًا في Preview: تسجيل الدخول، إنشاء Subject، رفع TXT/PDF/DOCX/صورة/صوت، انتظار processing، الضغط على Analyze topics، تغيير العربية، تجربة RTL، وفتح بطاقة الرسمة التعليمية في Dashboard.

## 6. قواعد مهمة عند مواصلة التطوير

- ابدأ بقراءة `docs/PROJECT_HANDOFF.md`؛ فهو يذكر ما تم وما لم يتم.
- حافظ على عزل `userId` في كل query وmutation، ولا تثق بـIDs القادمة من المتصفح دون ownership check.
- أي إجابة AI يجب أن تكون grounded في مادة المستخدم، وأي نقص سياق يجب أن يظهر للمستخدم بدل التخمين.
- حدّث `client/public/manus-routes.json` عند إضافة route جديد.
- استخدم `pnpm check`, `pnpm test`, `pnpm build`, و`git diff --check` قبل كل commit.
- لا force-push. احتفظ بتاريخ main.
- إذا كان remote `origin` يشير إلى Manus، لا تستبدله؛ يمكن استخدام remote منفصل باسم `github` للمزامنة.
- حدّث `docs/PROJECT_HANDOFF.md` بعد كل مرحلة، وسجّل ما بقي غير مكتمل أو فشل.

## 7. مسار العمل المقترح بعد التشغيل

المرحلة التالية الموصى بها هي اختبار end-to-end بعد تسجيل الدخول ورفع ملفات حقيقية، ثم تحسين retrieval الدلالي وFull Mock Exam وربط أخطاء الاختبارات بـStudy Manager. Material Search وFlashcards وReview Me وQuiz Attempts أُنجزت بالفعل. التفاصيل والقيود موجودة في قسم الاقتراحات داخل `docs/PROJECT_HANDOFF.md`.

## 8. تعافي الأخطاء

إذا فشل `pnpm install`: تحقق من Node/pnpm، ثم استخدم `corepack enable` ونسخة `pnpm@10.18.0` المحددة في `package.json`.

إذا فشل `db:migrate`: تحقق من Database capability و`DATABASE_URL`، ولا تعدّل migration يدويًا قبل قراءة الخطأ وحالة جدول migrations.

إذا ظهر `Storage config missing`: فعّل Storage/Service API في مشروع Manus ولا تضع المفتاح داخل الكود.

إذا ظهر `Built-in AI is not available`: فعّل Manus Service API/AI. لا تعتبر هذا عطلًا في retrieval قبل التحقق من البيئة.

إذا فشل النشر بسبب `/run/buildkit/buildkitd.sock`: هذه مشكلة بنية نشر مؤقتة موثقة سابقًا، وليست دليلًا على فشل الكود؛ أعد المحاولة من Dashboard بعد استقرار BuildKit وافحص log النشر.

إذا تعارضت تغييرات حساب Manus الآخر مع GitHub، اسحب `origin/main` و`github/main` وافحص الفرق يدويًا. لا تستخدم force-push ولا تحذف ملفات المشروع لاستبدالها بقالب جديد.
