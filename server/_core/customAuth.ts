import crypto from "node:crypto";
import { promisify } from "node:util";
import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { parse as parseCookies } from "cookie";
import { passwordResetTokens, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, SESSION_MAX_AGE_MS } from "@shared/const";
import {
  clearAuthFailures,
  isAuthRateLimited,
  recordAuthFailure,
} from "./authRateLimit";
import { isCurrentSessionVersion } from "./sessionVersion";
import { sendPasswordResetEmail } from "./email";

const scrypt = promisify(crypto.scrypt);
type LoginMethod = "email" | "phone";

function sessionSecret() {
  const value =
    process.env.STUDYNIVO_SESSION_SECRET ??
    process.env.AUTH_SESSION_SECRET ??
    process.env.MANUS_JWT_SECRET;
  if (!value || value.length < 32)
    throw new Error("A session secret must be at least 32 characters");
  return new TextEncoder().encode(value);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return value.trim().replace(/[\s().-]/g, "");
}

function validPhone(value: string) {
  return /^\+?[0-9]{7,15}$/.test(value);
}

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return (
    expected.length === derived.length &&
    crypto.timingSafeEqual(expected, derived)
  );
}

async function sessionToken(userId: number, sessionVersion: number) {
  return new SignJWT({ userId, sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(sessionSecret());
}

function requestCookies(req: Request) {
  return parseCookies(req.headers.cookie ?? "");
}

async function userFromRequest(req: Request) {
  const token =
    requestCookies(req)[COOKIE_NAME] ??
    req.headers.authorization?.replace(/^Bearer /, "");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    const db = await getDb();
    if (!db || typeof payload.userId !== "number") return null;
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);
    const user = rows[0];
    if (
      !user ||
      !isCurrentSessionVersion(payload.sessionVersion, user.sessionVersion)
    )
      return null;
    return user;
  } catch {
    return null;
  }
}

async function signIn(res: Response, user: typeof users.$inferSelect) {
  res.cookie(COOKIE_NAME, await sessionToken(user.id, user.sessionVersion), {
    ...getSessionCookieOptions({} as Request),
    maxAge: SESSION_MAX_AGE_MS,
  });
}

function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function publicOrigin(req: Request) {
  const configured = process.env.PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const origin = req.get("origin");
  if (origin && /^https?:\/\//i.test(origin)) return origin.replace(/\/$/, "");
  const protocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim() || req.protocol;
  const host = req.get("x-forwarded-host")?.split(",")[0]?.trim() || req.get("host");
  return `${protocol}://${host}`;
}

export async function invalidateUserSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(users)
    .set({ sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(eq(users.id, userId));
}

async function findUser(
  db: Awaited<ReturnType<typeof getDb>>,
  method: LoginMethod,
  identifier: string
) {
  if (!db) return undefined;
  return db
    .select()
    .from(users)
    .where(
      method === "email"
        ? eq(users.email, identifier)
        : eq(users.phoneNumber, identifier)
    )
    .limit(1)
    .then(rows => rows[0]);
}

export async function registerCustomAuthRoutes(app: Express) {
  app.post("/api/auth/credentials", async (req, res) => {
    try {
      const {
        method = "email",
        identifier,
        password,
        name,
        mode = "login",
      } = req.body as {
        method?: LoginMethod;
        identifier?: string;
        password?: string;
        name?: string;
        mode?: "login" | "register";
      };
      if (method !== "email" && method !== "phone")
        return res.status(400).json({ error: "Choose email or phone" });
      if (
        typeof identifier !== "string" ||
        typeof password !== "string" ||
        identifier.length > 320 ||
        password.length < 8 ||
        password.length > 128
      )
        return res
          .status(400)
          .json({
            error:
              "Enter your identifier and a password between 8 and 128 characters",
          });
      if (mode !== "login" && mode !== "register")
        return res.status(400).json({ error: "Invalid authentication mode" });
      const normalized =
        method === "email"
          ? normalizeEmail(identifier)
          : normalizePhone(identifier);
      if (method === "email" && !/^\S+@\S+\.\S+$/.test(normalized))
        return res.status(400).json({ error: "Enter a valid email address" });
      if (method === "phone" && !validPhone(normalized))
        return res
          .status(400)
          .json({ error: "Enter a valid phone number with country code" });
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      if (isAuthRateLimited(ip, method, normalized))
        return res
          .status(429)
          .json({ error: "Too many attempts. Try again in 15 minutes." });
      const db = await getDb();
      if (!db)
        return res.status(503).json({ error: "Database is not available" });
      let user = await findUser(db, method, normalized);
      if (mode === "register") {
        if (typeof name !== "string" || !name.trim() || name.trim().length > 120)
          return res.status(400).json({ error: "Enter your name" });
        if (user) {
          recordAuthFailure(ip, method, normalized);
          return res.status(409).json({
            error:
              method === "email"
                ? "This email is already registered. Sign in or use password recovery."
                : "This phone number is already registered. Sign in or use password recovery.",
            code: "IDENTIFIER_ALREADY_REGISTERED",
          });
        }
        {
          try {
            await db.insert(users).values({
              openId: `${method}:${crypto.randomUUID()}`,
              name: name.trim(),
              email: method === "email" ? normalized : null,
              phoneNumber: method === "phone" ? normalized : null,
              loginMethod: method,
              passwordHash: await hashPassword(password),
              lastSignedIn: new Date(),
            });
          } catch (error) {
            const code = (error as { code?: string })?.code;
            if (code !== "ER_DUP_ENTRY") throw error;
            recordAuthFailure(ip, method, normalized);
            return res.status(409).json({
              error:
                method === "email"
                  ? "This email is already registered. Sign in or use password recovery."
                  : "This phone number is already registered. Sign in or use password recovery.",
              code: "IDENTIFIER_ALREADY_REGISTERED",
            });
          }
          clearAuthFailures(ip, method, normalized);
        }
        const createdUser = await findUser(db, method, normalized);
        if (!createdUser)
          return res.status(500).json({ error: "Could not create account" });
        await signIn(res, createdUser);
        return res.json({ success: true });
      } else {
        if (
          !user?.passwordHash ||
          !(await verifyPassword(password, user.passwordHash))
        ) {
          recordAuthFailure(ip, method, normalized);
          return res
            .status(401)
            .json({ error: "Invalid email/phone or password" });
        }
        clearAuthFailures(ip, method, normalized);
        await db
          .update(users)
          .set({ lastSignedIn: new Date() })
          .where(
            and(
              eq(users.id, user.id),
              method === "email"
                ? eq(users.email, normalized)
                : eq(users.phoneNumber, normalized)
            )
          );
        user = await findUser(db, method, normalized);
      }
      if (!user)
        return res.status(500).json({ error: "Could not create account" });
      await signIn(res, user);
      res.json({ success: true });
    } catch (error) {
      console.error("[Custom Auth] Credentials auth failed", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/auth/password-reset/request", async (req, res) => {
    const identifier = typeof req.body?.email === "string" ? req.body.email : "";
    const normalized = normalizeEmail(identifier);
    const genericResponse = {
      success: true,
      message: "If an account exists for that email, a reset link has been sent.",
    };
    if (!/^\S+@\S+\.\S+$/.test(normalized))
      return res.status(400).json({ error: "Enter a valid email address" });
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database is not available" });
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, normalized))
        .limit(1);
      const user = rows[0];
      console.info("[Password Reset] Account lookup", {
        emailDomain: normalized.split("@")[1] ?? "unknown",
        accountFound: Boolean(user?.passwordHash),
      });
      if (!user?.passwordHash) return res.json(genericResponse);

      const token = crypto.randomBytes(32).toString("hex");
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
      const resetUrl = `${publicOrigin(req)}/login?reset=${encodeURIComponent(token)}`;
      try {
        await sendPasswordResetEmail({ to: normalized, name: user.name, resetUrl });
      } catch (error) {
        console.error(
          "[Password Reset] Email delivery failed",
          error instanceof Error ? error.message : String(error),
        );
      }
      return res.json(genericResponse);
    } catch (error) {
      console.error("[Password Reset] Request failed", error);
      return res.json(genericResponse);
    }
  });

  app.post("/api/auth/password-reset/confirm", async (req, res) => {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!/^[a-f0-9]{64}$/.test(token) || password.length < 8 || password.length > 128)
      return res.status(400).json({ error: "Invalid or expired reset link" });
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database is not available" });
      const rows = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, hashResetToken(token)),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        )
        .limit(1);
      const reset = rows[0];
      if (!reset) return res.status(400).json({ error: "Invalid or expired reset link" });
      const claimed = await db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(passwordResetTokens.id, reset.id),
            isNull(passwordResetTokens.usedAt)
          )
        );
      if (Number(claimed[0].affectedRows ?? 0) !== 1)
        return res.status(400).json({ error: "Invalid or expired reset link" });
      await db
        .update(users)
        .set({ passwordHash: await hashPassword(password), sessionVersion: sql`${users.sessionVersion} + 1` })
        .where(eq(users.id, reset.userId));
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, reset.userId));
      return res.json({ success: true });
    } catch (error) {
      console.error("[Password Reset] Confirmation failed", error);
      return res.status(500).json({ error: "Could not reset password" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const user = await userFromRequest(req);
      if (user) await invalidateUserSessions(user.id);
      res.clearCookie(COOKIE_NAME, getSessionCookieOptions(req));
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Could not end the session" });
    }
  });
}

export { userFromRequest };
