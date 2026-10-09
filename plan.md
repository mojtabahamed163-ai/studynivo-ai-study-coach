# خطة تنفيذ StudyNivo

## 1. الهدف والنتيجة المطلوبة

بناء تطبيق ويب كامل باسم **StudyNivo — Your Personal AI Study Coach** داخل مشروع Webdev المُهيأ في:

`/home/ubuntu/studynivo`

المنتج ليس أداة تلخيص ملفات؛ بل مساحة دراسة شخصية لكل طالب، يفهم مواده وأداءه وموعد امتحانه ووقته المتاح، ثم يجيب بوضوح عن السؤال: **What should I study now?** ويحوّل الإجابة إلى جلسة فعلية، شرح، تدريب، مراجعة، وتتبع تقدّم.

سيكون التطبيق:

- قابلًا للاستخدام على الهاتف أولًا، ثم الشاشات الأكبر.
- متعدد اللغات مع الإنجليزية كلغة افتراضية و14 لغة مطلوبة، مع RTL عربي حقيقي.
- قائمًا على حسابات وبيانات خاصة بكل مستخدم.
- مبنيًا على الخادم وقاعدة البيانات والتخزين المُدارين في Manus.
- مستخدمًا لطبقة AI منفصلة وقابلة للتغيير، مع الاعتماد على خدمة Manus AI المدمجة بدل API خارجي مدفوع أو بطاقة بنكية.
- منشورًا على رابط Manus المجاني، دون شراء نطاق أو إضافة دفع/اشتراكات.

## 2. ما هو داخل النسخة المطلوبة

### تجربة الزائر والحساب

- Landing Page واضحة برسالة: **Stop wondering what to study. StudyNivo tells you what to study next.**
- شرح مسار Understand → Study → Practice → Review → Track Progress دون ادعاءات ضمان النجاح.
- تجربة تسجيل قصيرة تبدأ بإنشاء أول مادة ورفع مصدر، مع إمكانية تخطي التفاصيل الثانوية.
- طبقة مصادقة حقيقية مرتبطة ببيانات المستخدم، وليست مستخدمًا تجريبيًا داخل Preview.
- دعم مسارات Email/Password وGoogle بطريقة قابلة للتشغيل فقط. سيُستخدم Manus OAuth كمسار المنصة الافتراضي، وتُبنى محولات Email وGoogle مستقلة عند توفر إعداداتهما الفعلية. إذا احتاج Google Client ID/Secret أو إعدادًا خارجيًا غير موجود، سيُطلب عبر مسار الأسرار المحمي بعد الموافقة، ولن يظهر زر دخول وهمي أو نجاح مزيف.

### Subject Study Spaces

- إنشاء المادة بسرعة: Create Subject → Upload Material → Start Studying.
- مساحة مستقلة لكل مادة، تمنع اختلاط السياق أو البيانات.
- تبويبات منظّمة داخل المادة: Overview، Materials، Topics، Study، Practice، Flashcards، Chat، Progress.
- دعم عدة مصادر داخل المادة الواحدة: PDF، Word، TXT، نص ملصوق، صور متعددة كمادة واحدة، وملفات صوتية MP3/WAV/OGG/M4A.
- فهرس مصدر لكل ملف مع حالة المعالجة، الحجم، اللغة، الصفحة/القسم/التوقيت عند توفره، وحالة الخطأ.

### تحليل المواد وAI grounded

- معالجة الملفات الكبيرة بطريقة chunking وretrieval وtopic indexing بدل إرسال الكتاب كله إلى النموذج.
- استخراج Topics والعناوين والمفاهيم والتعريفات والقوانين والتواريخ والمصطلحات وأمثلة ونقاط الحفظ والفهم وروابط المفاهيم.
- لكل Topic: Summary، Explanation، Questions، Flashcards، Mastery، Mistakes، Review Status.
- مستويات الملخص: Quick Summary، Study Summary، Exam Review.
- أفعال الشرح: Explain this simply، Give me an example، Test me، What should I memorize؟، Connect this.
- Ask Your Material داخل المادة فقط، مع مراجع مصدر مثل Page/Section/Audio timestamp.
- البحث داخل المادة، وحفظ Bookmark/Saved Item، وعرض التعارضات بين المصادر بدل اختيار إجابة صامتًا.
- قاعدة مضادة للهلوسة: إذا لم يكفِ السياق أو كان المصدر غير واضح، يصرّح التطبيق بذلك ويطلب مصدرًا أوضح، ولا يخمّن.
- الصوت يرسل إلى Whisper-compatible transcription المدمج، ويحفظ النص وsegments/timestamps؛ لا يوجد تسجيل داخل التطبيق.

### التدريب والتقدّم

- توليد أسئلة مناسبة لطبيعة المادة: Multiple Choice، True/False، Short Answer، Definitions، Calculation/Problem Solving، Essay/Open-ended.
- Practice Test وFull Mock Exam مع الإجابات والشرح والمراجع.
- تقرير بعد الاختبار: Score، Correct/Wrong، Strong Topics، Weak Topics، Mistakes، Recommended Next Step.
- Confidence Level Low/Medium/High بعد الإجابات، مع عدم اعتبار الإجابة الصحيحة منخفضة الثقة إتقانًا كاملًا.
- Flashcards مهمة مبنية على المحتوى، مع صعوبة البطاقة ومراجعتها لاحقًا.
- Review Me يعتمد على الأخطاء والموضوعات الضعيفة وطلبات الشرح والإجابات منخفضة الثقة والعناصر المحفوظة، مع مراجعة متباعدة بسيطة.
- Study Manager مركزي يختار المهمة التالية بناء على الامتحانات، حجم المحتوى، الإتقان، الضعف، الأخطاء، الخطة، الجلسات السابقة، والوقت الفعلي.
- Study Plan مرن يتعلم من السلوك الفعلي ويعدل التوقعات بدل خطة جامدة.
- Exam Countdown وSubject Mastery وTopic Mastery وWeak Areas وMistakes وReview Priority.
- جلسات 10/20/30/45/60/90/Custom، قابلة للإيقاف والاستكمال، مع حفظ المهمة والمكان والأسئلة والإجابات والأخطاء والوقت والتقدم.
- Continue Session وStart Today’s Plan للجلسات غير المكتملة، مع قرار Study Manager بنقل المهمة أو تصغيرها أو استمرار الخطة وفق الأولوية.
- تحفيز محدود يخدم الدراسة: Points، Study Streak، Badges، Student Level، Achievements، Daily Goals، Mastery Progress، دون Leaderboards أو شبكة اجتماعية.

### i18n وRTL

- قاموس ترجمة مركزي typed بدل النصوص الثابتة داخل المكونات.
- اللغات: English، Arabic، Spanish، Portuguese، French، German، Italian، Turkish، Japanese، Korean، Chinese Simplified، Hindi، Russian، Indonesian.
- الإنجليزية افتراضيًا في أول زيارة، مع تغيير اللغة من onboarding/settings دون فقدان الحالة.
- `dir="rtl"` للعربية، و`dir="ltr"` لباقي اللغات، مع عكس الهوامش والأيقونات والقوائم عند الحاجة.
- لغة الواجهة مستقلة عن لغة المادة؛ لا تُترجم المادة تلقائيًا إلا بطلب المستخدم.

## 3. التصميم وتجربة الاستخدام

### Design Movement

**Calm productivity SaaS / editorial study workspace**: مزيج من وضوح أدوات الإنتاجية الحديثة ودفء دفتر الملاحظات الأكاديمي، مع واجهة تعتمد على الأولوية والقراءة لا على ازدحام البطاقات.

### Core Principles

1. **Next action first**: كل شاشة تجيب بسرعة عن الفعل التالي، لا تعرض لوحة مؤشرات بلا قرار.
2. **Evidence over decoration**: أي تقدم أو إجابة أو قرار Study Manager مرتبط بمصدر أو دليل أداء.
3. **Quiet confidence**: ألوان ومسافات هادئة، وحالات نجاح واضحة دون gamification صاخبة.
4. **Mobile-native focus**: شريط تنقل سفلي قابل للمس، أزرار كبيرة، ومحتوى متدرج من الإجراء الأساسي إلى التفاصيل.

### Color Philosophy

- خلفية عاجية دافئة قريبة من الورق لتقليل إحساس لوحة التحكم الباردة.
- كحلي عميق للنص والقرارات المهمة لأنه يوحي بالثقة والتركيز.
- لون العلامة القابل للتملك: **StudyNivo Teal `#0F766E`**، يرمز إلى الهدوء والتقدم المستمر ويظهر في زر Start Studying والمؤشرات الرئيسية.
- أخضر Sage للحالات الإيجابية والإتقان، وكهرماني منخفض التشبع للتنبيه والمراجعة، وأحمر محكوم للأخطاء فقط.
- لا تُستخدم تدرجات لامعة أو ألوان ألعاب.

### Layout Paradigm

- على الهاتف: صفحة عمودية ذات **focus rail**؛ عنوان مختصر، بطاقة الإجراء الرئيسي، ثم الأدلة المساندة.
- على سطح المكتب: عمود تنقل ضيق ثابت + مساحة عمل رئيسية + عمود سياق اختياري للمهمة/المصدر، بدل شبكة بطاقات مركزية مزدحمة.
- داخل المادة: رأس سياقي ثابت يوضح اسم Subject ومؤشر الإتقان، ثم تبويب واحد واضح في كل مرة.

### Signature Elements

1. **Nivo mark**: رمز ورقة/بوصلة صغير مكوّن من قوسين يلتقيان عند نقطة، بجانب wordmark مخصص بدل نص افتراضي.
2. **Next Study card**: شريط قرار teal مع Reason وRecommended time وStart Studying.
3. **Evidence chips**: شرائح صغيرة مثل Page 14 أو Genetics أو Low confidence تربط القرار بالدليل.

### Interaction and Animation

- انتقالات قصيرة 160–220ms للبطاقات والتبويبات، دون حركات مستمرة تشتت الطالب.
- عند بدء جلسة، يظهر تحول خفيف في بطاقة المهمة وتقدم زمني ثابت.
- عند تحميل AI، يظهر skeleton محلي مع نص مترجم واضح مثل “Building your study next step…”، ويُمنع تكرار الإرسال.
- الأخطاء تحافظ على إدخال المستخدم وتقدم Retry لنفس العملية.
- Focus states ولوحة مفاتيح ومناطق لمس لا تقل عن 44px.

### Typography System

- واجهة: **Plus Jakarta Sans** أو نظام sans قريب، بوزن 500–700 للعناوين و400–500 للنص.
- المحتوى الطويل: نفس العائلة مع line-height واسع؛ يمكن استخدام serif خفيف للمقتطفات الأكاديمية فقط إذا لم يضر RTL.
- أحجام الهاتف تبدأ من 14px للنص المساعد، 16px للنص الأساسي، 28–34px للعناوين الرئيسية، وتكبر تدريجيًا على desktop.

### Brand Essence and Voice

- التموضع: **مدير دراسة شخصي يحوّل موادك وأخطاءك ووقتك إلى الخطوة الدراسية التالية.**
- الشخصية: **focused، encouraging، evidence-led**.
- نبرة العناوين: مباشرة وهادئة: “Your next best study step” بدل “Welcome to our website”.
- أمثلة microcopy: “Genetics is next — your exam is close and this topic needs another pass.” و“Good work. One low-confidence answer is still worth reviewing.”
- الشعار: **Your Personal AI Study Coach**.

## 4. البنية التقنية المقترحة

### Frontend

إعادة استخدام React/Vite/Tailwind/TypeScript والقوالب الموجودة في `client/src/`، مع تنظيمها إلى:

- `client/src/App.tsx`: route tree وprotected layout.
- `client/src/pages/`: Landing، Auth، Onboarding، Dashboard، Subjects، SubjectSpace، StudyPlan، Review، Progress، SavedItems، Settings، StudySession، PracticeTest، MockExam، NotFound.
- `client/src/components/layout/`: AppShell، Sidebar، MobileBottomNav، SubjectHeader، PageHeader.
- `client/src/components/study/`: NextStudyCard، SessionTimer، MasteryRing، EvidenceChip، TopicRow، ReviewQueue.
- `client/src/components/materials/`: UploadDropzone، SourceList، ProcessingStatus، ContentViewer، SourceReference.
- `client/src/components/tests/`: QuestionRenderer، ConfidencePicker، ResultBreakdown.
- `client/src/components/ui/`: مكونات shadcn الحالية، مع الحفاظ على قابلية الوصول.
- `client/src/i18n/`: types، dictionaries، language metadata، RTL helpers.
- `client/src/lib/`: trpc client، formatting، date/time، route helpers.
- `client/src/styles/`: tokens وglobals وresponsive rules.

### Backend

- `server/routers.ts`: تجميع routers مع protected procedures وتحقق ownership.
- `server/routers/auth.ts`: login/session/logout/providers، مع الحفاظ على `webdev_app_session` وقيود Preview.
- `server/routers/subjects.ts`: subjects، materials، topics، saved items.
- `server/routers/ai.ts`: analyze، summarize، explain، ask، generateQuestions، generateFlashcards.
- `server/routers/tests.ts`: quizzes، attempts، answers، confidence، result analysis.
- `server/routers/study.ts`: Study Manager، plans، sessions، pause/resume، streaks.
- `server/routers/progress.ts`: mastery، weak areas، mistakes، review priority.
- `server/ai/client.ts`: عميل Manus `/v1/chat/completions`، model selection، structured output، retries، parsing.
- `server/ai/prompts/`: قوالب grounded حسب العملية واللغة.
- `server/ai/schemas.ts`: Zod schemas ومطابقة JSON الناتج.
- `server/ai/retrieval.ts`: chunk selection، topic/source filters، source citations.
- `server/ai/materialProcessor.ts`: text extraction، chunking، indexing، OCR/image path، audio transcription.
- `server/studyManager.ts`: scoring واضح قابل للاختبار لاختيار المهمة التالية.
- `server/storage.ts`: stable object keys وpresigned transfer، مع التحقق من الحجم والنوع والملكية.
- `server/db.ts`: queries scoped by authenticated user، وعدم استخدام IDs من الطلب دون ownership check.

### قاعدة البيانات

توسيع `drizzle/schema.ts` بمخطط additive مرتبط بـ`users.id`، مع فهارس على `userId` و`subjectId` و`topicId` و`createdAt`:

- `userProfiles` و`userPreferences`: اللغة، المنطقة، وقت الدراسة، مستوى الطالب.
- `subjects`: اسم المادة، الوصف، تاريخ الامتحان، لغة المحتوى، المستوى، الإتقان المحسوب.
- `materials`: نوع المصدر، الاسم، storage key، mime/size، اللغة، الحالة، المصدر الأم لمجموعة الصور، مدة الصوت.
- `materialChunks`: نص/embedding-ready metadata، page/section/timestamp، ترتيب chunk، hash، حالة الفهرسة.
- `topics` و`topicSources`: المواضيع، summary tiers، mastery، confidence، weak/review flags، علاقة المواضيع بالمصادر/chunks.
- `questions` و`quizzes` و`quizAttempts` و`quizAnswers`: النوع، المصدر، الاختيارات، الإجابة الصحيحة، الشرح، المحاولة، confidence.
- `flashcards` و`reviewItems`: front/back، topic، difficulty، due date، interval، lapse count.
- `mistakes`: السؤال، الإجابة، السبب، topic، source reference، recurrence، resolution.
- `savedItems`: مقتطف، subject/topic/source reference، createdAt.
- `studyPlans` و`studyTasks`: خطة مرنة، duration، priority، reason، status، generatedBy.
- `studySessions` و`sessionEvents`: حالة الجلسة، current step، elapsed time، answers، pause/resume، completion.
- `progressEvents` و`achievements`: أداء فعلي، streak، daily goal، points، مستوى الطالب.
- `aiRuns` أو metadata تشخيصي محدود: نوع العملية وحالتها وfailure reason دون حفظ أسرار أو محتوى غير لازم.

كل query وmutation يبدأ من المستخدم المصادق عليه ويضيف شرط الملكية، بحيث لا يسمح تغيير `subjectId` أو URL ID بالوصول إلى بيانات حساب آخر.

### الملفات والتخزين

- الخادم يتحقق من MIME والامتداد والحجم قبل presign.
- تخزين الملفات الكبيرة في Manus object storage، وحفظ stable `/manus-storage/<key>` وmetadata في DB.
- لا تُحفظ الملفات الكبيرة في Git ولا تُعرض signed URLs الدائمة للمستخدم.
- الصور المتعددة تُجمع عبر `collectionId` كمصدر منطقي واحد.
- الصوت يُرفع ثم يُمرر إلى transcription server-side، مع حفظ النص وsegments.
- الملفات أو الصور غير الواضحة تظل بحالة واضحة `needs_review` مع رسالة للمستخدم بدل تخمين التحليل.

### AI layer وGrounding

- استعمال Manus AI المدمج دون مفتاح مزود خارجي.
- الاستعلام دائمًا محصور في `subjectId` ثم `topicId`/chunks ذات الصلة.
- structured JSON حيث يدعم النموذج، مع model صريح، `strict: true`، وfallback parse آمن وفق عقد LLM.
- عدم اعتبار وجود `choices` نجاحًا دون `message.content` صالح.
- retry مرة واحدة فقط عند غياب structured content، ثم إظهار فشل حقيقي مع الاحتفاظ بالمدخل.
- كل ناتج يحتوي `sourceRefs` و`confidence` و`insufficientContext` و`conflicts` عند الحاجة.
- لا تُخلط لغة الواجهة بلغة المحتوى داخل prompt؛ يظل output لغة الدراسة أو اللغة المطلوبة صراحة.

### API والتهيئة

- استخدام tRPC للعمليات التطبيقية وExpress handlers للـhealth/ملفات خاصة عند الحاجة.
- الحفاظ على `/api/health`.
- إنشاء `public/manus-routes.json` يتضمن جميع المسارات الفعلية.
- تهيئة diagnostics عبر `webdev.config` قبل أول دفعة كود.
- إضافة `app.config.ts` مع `logoUrl` literal إلى أصل شعار StudyNivo دائم؛ الشعار البصري نفسه يمكن أن يكون SVG صغيرًا محفوظًا/مرفوعًا وفق عقد التخزين.
- عدم إرسال أسرار الخادم إلى المتصفح.
- إعداد Docker/build الموجودين في القالب بما يضمن البناء من checkpoint، مع `PORT` الافتراضي 3000 وhealth path `/api/health`.

## 5. ترتيب التنفيذ

### المرحلة 1 — أساس المنتج العامل

1. فحص ملفات القالب، تسجيل diagnostics، وإنشاء route manifest.
2. بناء design tokens وAppShell وLanding وAuth وOnboarding، مع المصادقة الحقيقية والمسارات المحمية.
3. إضافة schema والمigrations وownership queries.
4. بناء Subjects وMaterials ورفع/فهرسة الملفات مع حالات processing.
5. تنفيذ AI abstraction، استخراج النص، chunking، transcription، والتحليل الأولي إلى topics.
6. بناء Dashboard action-oriented وNext Study card وStudy Manager الأساسي.
7. بناء Subject Space وsummaries وAsk Your Material وsource references.
8. بناء questions وPractice Test وresults وربط mistakes/progress بالخطة.
9. بناء study sessions pause/resume وContinue Session.
10. بناء Progress وStudy Plan وExam Countdown.
11. إضافة i18n المركزي لكل النصوص المطلوبة وRTL/mobile polish.

### المرحلة 2 — التكاملات المطلوبة لإكمال المنتج

1. Flashcards مع difficulty وreview queue.
2. Review Me مع spaced review بسيطة وتغذية راجعة من confidence.
3. Full Mock Exam وتحليل تفصيلي.
4. Search داخل المادة وSaved Items وsource navigation.
5. Motivation layer المحدود.
6. استكمال حالات الخطأ، المحتوى الكبير، الصور غير الواضحة، الصوت، والتعارضات بين المصادر.
7. إكمال مسار Google/Email الواقعي وفق الإعدادات المتاحة، أو إبقاء المسار غير المهيأ غير ظاهر بدل زر لا يعمل.
8. إنتاج شعار/metadata، تحسين SEO للـLanding، ثم checkpoint والنشر على رابط Manus المجاني فقط.

## 6. خطة التحقق وقبول المنتج

سيتم التحقق من الكود عبر `pnpm check` و`pnpm test` و`pnpm build`، مع مراجعة diagnostics بعد كل دفعة كبيرة، ثم تشغيل الخادم على `0.0.0.0:3000` وفحص `/api/health` و`/manus-routes.json`.

سيتم تتبع سيناريو كامل من Landing إلى الحساب ثم Biology وChemistry، رفع مصدر واحد وعدة مصادر، تحليل topics، summary، شرح، flashcards، bookmark، البحث، practice test، confidence، الأخطاء، Study Manager، جلسة قابلة للإيقاف والاستكمال، Progress، ثم تغيير اللغة إلى العربية والتحقق من RTL وعلى viewport صغير. كما سيتم التحقق من عزل بيانات Biology عن Chemistry بتغيير IDs غير مملوكة، ومن رسائل الملفات غير المدعومة/الكبيرة وغير الواضحة، ومن فشل AI وإعادة المحاولة دون حفظ مكرر.

سيتم استخدام مراجعة مستقلة read-only على المشروع بعد اكتمال التنفيذ لتتبع المتطلبات عبر الواجهة والخادم وقاعدة البيانات، ثم إصلاح أي مشكلة مؤكدة قبل checkpoint. لا تُعتبر الواجهة مكتملة إذا كانت هناك أزرار أساسية بلا mutation أو بيانات غير محفوظة.

## 7. الافتراضات والمخاطر المفتوحة

- المشروع المهيأ حاليًا يستخدم React/Express/tRPC/Drizzle مع `server:true` و`database:true` ومواردهما مُدارة من Manus.
- Manus AI المدمج هو مسار AI الأول؛ لا توجد إضافة Payment أو اشتراك أو API خارجي مدفوع.
- Google OAuth يحتاج إعداد provider حقيقي. لا يمكن إنشاء Client ID/Secret من داخل التطبيق؛ إذا لم تكن الإعدادات متاحة، سيُطلب إدخالها عبر بطاقة الأسرار المحمية أو سيُترك الخيار غير ظاهر حتى يُهيأ، دون محاكاة.
- Email/Password يتطلب مسار مصادقة مستقلًا عن Manus OAuth رغم أن Manus OAuth هو الافتراضي في القالب؛ سيتم بناؤه فقط لأن المواصفة طلبته صراحة، مع جلسات آمنة وcookie متوافقة مع Preview.
- OCR للصور سيُنفذ بمسار مجاني حقيقي يمكن تشغيله في البيئة. إذا كان OCR المحلي غير موثوق لنوع صورة معين، ستُعرض حالة “image unclear / needs a clearer upload” بدل الادعاء بأن التحليل تم.
- المعالجة الدائمة للملفات الكبيرة ستستخدم التخزين وقاعدة البيانات؛ لا تعتمد على ملفات filesystem المؤقتة أو signed URL منتهية الصلاحية.
- نشر التطبيق على رابط Manus المجاني هو النتيجة المطلوبة؛ لا شراء نطاق ولا نشر خارجي في هذه المرحلة.
- الخطة كبيرة؛ سيتم بناء كل مجموعات Priority 1 ثم Priority 2 دون حذفها، مع إبقاء كل ميزة أساسية functional أو غير ظاهرة إذا كانت تفتقد اعتمادًا حقيقيًا.

## 8. ميزة الشرح الأساسية — التنفيذ الحالي

### النطاق المعتمد

سنكمل داخل تبويب **Ask your material** في مساحة المادة مسارًا واحدًا واضحًا: اختيار مصدر مفهرس أو كل المصادر، اختيار أحد أفعال الشرح الخمسة، عرض شرح grounded مرتبط بمراجع المصدر ومقتطفات نصية متحقَّق منها، ثم عرض 3–5 أسئلة قصيرة وسؤال تحقق نهائي. لن نوسّع هذه الدفعة إلى خطط دراسة أو نقاط جديدة.

### التنفيذ والخصوصية

- يرسل الخادم `subjectId` و`materialId` و`action` إلى tRPC؛ الخادم يتحقق من ملكية المادة والمادة الأم قبل اختيار chunks، ولا يقبل نص مصدر يرسله المتصفح كبديل عن قاعدة البيانات.
- يظل `askMaterial` هو مسار الذكاء الاصطناعي الوحيد، مع عقد JSON صارم يضيف `practiceQuestions` و`checkQuestion` إلى الإجابة، والتحقق من أن كل quote وsource label موجود فعلًا في chunks المرسلة.
- مسار `askTextMaterial` القديم لا يقبل سياقًا حرًا فعليًا: يتطلب موضوعًا محفوظًا مملوكًا ويعيد بناء السياق من قاعدة البيانات؛ واجهة الشرح الجديدة لا تستدعيه في المعاينة غير المحفوظة.
- تحفظ الواجهة سجل المحادثة وتقدم جلسة الشرح في localStorage بمفتاح المستخدم/المادة/المصدر، مع تنظيف السجل عند تبديل المصدر. لا يُحفظ أي محتوى في حساب آخر ولا تُعرض مفاتيح مزود AI للمتصفح.
- إذا لم توجد chunks مطابقة أو لم يمر الاقتباس بالتحقق، تعرض الواجهة رسالة «لم أجد هذه المعلومة في الملف» وتمنع عرضها كحقيقة؛ وتبقى أزرار retry والمصدر واضحة.
- OCR والصوت خارج مسار الشرح الأول؛ الملفات المفهرسة الحالية فقط هي المؤهلة، وتظهر الصور غير الواضحة بحالة `needs_review` الموجودة أصلًا.

### التصميم

نستخدم **editorial study workspace** الموجود: شريط قرار teal، أدوات اختيار صغيرة عالية التباين، واقتباسات evidence داخل بطاقة مستقلة. التفاعل يبدأ بفعل واحد واضح، ثم ينتقل إلى الشرح فالاسترجاع النشط. الحركة 160–220ms فقط، والواجهة RTL عند العربية عبر النظام الحالي.

### بوابة مزود AI والتكلفة

تمت قراءة عقد المنصة: استدعاءات LLM المدمجة تخصم من رصيد المشروع، لكن لا توجد في هذه البيئة بيانات `MANUS_API_URL` أو `MANUS_API_KEY` ولا سعر مؤكد لكل استدعاء. لذلك لم يُنفَّذ أي استدعاء نموذج أثناء التطوير أو الاختبار، ولم تُضف إجابات تجريبية متخفية كإجابات حقيقية. عند الموافقة الصريحة على المزود/التكلفة، يُختبر المسار أولًا على مصدر صغير ثم يُفعّل في Preview.
