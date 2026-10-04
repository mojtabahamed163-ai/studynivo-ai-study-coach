# قائمة تحقق الحساب الجديد

## قبل الاستيراد

- [ ] حساب Manus الجديد يملك وصول GitHub إلى `mojtabahamed163-ai/studynivo-ai-study-coach`.
- [ ] الاستيراد من `main`، وليس من قالب أو مشروع Manus قديم.
- [ ] اختيار Web / Server-enabled.
- [ ] تفعيل Server وDatabase.
- [ ] إعداد مشروع جديد مستقل؛ لا استخدام Resource URI قديم.

## بعد الاستيراد

- [ ] `pnpm install --frozen-lockfile`
- [ ] `STUDYNIVO_SESSION_SECRET` جديد، عشوائي، 32+ حرفًا، محفوظ عبر Secrets.
- [ ] Manus Database وService API/AI وStorage مفعلة.
- [ ] تشغيل `pnpm db:migrate` من جذر المشروع.
- [ ] تشغيل `pnpm dev` من Terminal WebDev المرتبط.
- [ ] `/api/health` يعيد `{"status":"ok"}`.
- [ ] `/manus-routes.json` يعيد JSON routes.

## E2E المطلوب قبل النشر

- [ ] إنشاء حساب وتسجيل الدخول.
- [ ] إنشاء Subject.
- [ ] رفع TXT وانتظار `indexed`.
- [ ] Analyze topics وإنشاء Topics مع source refs.
- [ ] Ask Material بإجابة grounded ومصدر.
- [ ] Generate Flashcards وتحقق من حفظها.
- [ ] Practice: إنشاء محاولة، إجابة، confidence، تقرير.
- [ ] Full Mock: لا تظهر answer/explanation/score قبل الإكمال.
- [ ] Reload: استعادة المحاولة والتقرير من الخادم.
- [ ] Review Me وتحديث البطاقة.
- [ ] Start/pause/complete Study Session وتحقق Progress.
- [ ] تجربة العربية RTL، لغة أخرى، Light وDark.
- [ ] اختبار ownership بحسابين.

## فحوص التسليم

```bash
pnpm check
pnpm test --run
pnpm build
git diff --check
```

- [ ] لا توجد أسرار أو `.env` متتبعة.
- [ ] لا يوجد `force-push`.
- [ ] تم تحديث `docs/HANDOFF_FOR_NEW_MANUS_ACCOUNT.md` بآخر SHA ونتيجة E2E.
- [ ] تم حفظ checkpoint في مشروع الحساب الجديد.
- [ ] تم نشر مشروع الحساب الجديد فقط.
- [ ] تم اختبار الرابط الجديد وتسجيله في handoff.
