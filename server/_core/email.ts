type PasswordResetEmail = {
  to: string;
  name?: string | null;
  resetUrl: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
      character
    ]!
  );
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: PasswordResetEmail) {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.BREVO_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    throw new Error("Password reset email service is not configured");
  }

  const greeting = name?.trim() ? `مرحبًا ${escapeHtml(name.trim())}` : "مرحبًا";
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: from, name: "StudyNivo" },
      to: [{ email: to }],
      subject: "استعادة كلمة مرور StudyNivo",
      textContent: `${name?.trim() ? `مرحبًا ${name.trim()}` : "مرحبًا"},\n\nاستخدم هذا الرابط لإنشاء كلمة مرور جديدة لحسابك في StudyNivo:\n${resetUrl}\n\nالرابط صالح لمدة 15 دقيقة ويُستخدم مرة واحدة فقط. إذا لم تطلب ذلك، تجاهل هذه الرسالة.`,
      htmlContent: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>استعادة كلمة مرور StudyNivo</h2><p>${greeting}،</p><p>اضغط الزر التالي لإنشاء كلمة مرور جديدة لحسابك:</p><p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px">إنشاء كلمة مرور جديدة</a></p><p>الرابط صالح لمدة 15 دقيقة ويُستخدم مرة واحدة فقط.</p><p>إذا لم تطلب استعادة كلمة المرور، تجاهل هذه الرسالة.</p></div>`,
    }),
  });

  if (!response.ok) {
    const providerBody = (await response.text()).replace(/\s+/g, " ").slice(0, 400);
    throw new Error(
      `Password reset email provider returned ${response.status}${providerBody ? `: ${providerBody}` : ""}`,
    );
  }
  const result = (await response.json().catch(() => null)) as {
    messageId?: string;
  } | null;
  console.info("[Password Reset] Email accepted by Brevo", {
    messageId: result?.messageId ? "present" : "missing",
    recipientDomain: to.split("@")[1] ?? "unknown",
  });
}
