import nodemailer from "nodemailer";

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
  const smtpUser = process.env.GMAIL_SMTP_USER?.trim();
  const appPassword = process.env.GMAIL_SMTP_APP_PASSWORD?.replace(/\s+/g, "");
  const from = process.env.GMAIL_SMTP_FROM_EMAIL?.trim() || smtpUser;
  if (!smtpUser || !appPassword || !from) {
    throw new Error("Password reset email service is not configured");
  }

  const greeting = name?.trim() ? `مرحبًا ${escapeHtml(name.trim())}` : "مرحبًا";
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: smtpUser, pass: appPassword },
  });
  const result = await transporter.sendMail({
    from: { name: "StudyNivo", address: from },
    to,
    replyTo: from,
    subject: "استعادة كلمة مرور StudyNivo",
    text: `${name?.trim() ? `مرحبًا ${name.trim()}` : "مرحبًا"},\n\nاستخدم هذا الرابط لإنشاء كلمة مرور جديدة لحسابك في StudyNivo:\n${resetUrl}\n\nالرابط صالح لمدة 15 دقيقة ويُستخدم مرة واحدة فقط. إذا لم تطلب ذلك، تجاهل هذه الرسالة.`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>استعادة كلمة مرور StudyNivo</h2><p>${greeting}،</p><p>اضغط الزر التالي لإنشاء كلمة مرور جديدة لحسابك:</p><p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 18px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px">إنشاء كلمة مرور جديدة</a></p><p>الرابط صالح لمدة 15 دقيقة ويُستخدم مرة واحدة فقط.</p><p>إذا لم تطلب استعادة كلمة المرور، تجاهل هذه الرسالة.</p></div>`,
  });
  console.info("[Password Reset] Email accepted by Gmail SMTP", {
    messageId: result.messageId ? "present" : "missing",
    recipientDomain: to.split("@")[1] ?? "unknown",
  });
}
