import crypto from "node:crypto";
import { promisify } from "node:util";
import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { and, eq } from "drizzle-orm";
import { parse as parseCookies } from "cookie";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const scrypt = promisify(crypto.scrypt);
type LoginMethod = "email" | "phone";

function sessionSecret() {
  const value = process.env.AUTH_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SESSION_SECRET must be at least 32 characters");
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
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

async function sessionToken(userId: number) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1y")
    .sign(sessionSecret());
}

function requestCookies(req: Request) {
  return parseCookies(req.headers.cookie ?? "");
}

async function userFromRequest(req: Request) {
  const token = requestCookies(req)[COOKIE_NAME] ?? req.headers.authorization?.replace(/^Bearer /, "");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    const db = await getDb();
    if (!db || typeof payload.userId !== "number") return null;
    const rows = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function signIn(res: Response, user: typeof users.$inferSelect) {
  res.cookie(COOKIE_NAME, await sessionToken(user.id), {
    ...getSessionCookieOptions({} as Request),
    maxAge: ONE_YEAR_MS,
  });
}

async function findUser(db: Awaited<ReturnType<typeof getDb>>, method: LoginMethod, identifier: string) {
  if (!db) return undefined;
  return db
    .select()
    .from(users)
    .where(method === "email" ? eq(users.email, identifier) : eq(users.phoneNumber, identifier))
    .limit(1)
    .then((rows) => rows[0]);
}

export async function registerCustomAuthRoutes(app: Express) {
  app.post("/api/auth/credentials", async (req, res) => {
    try {
      const { method = "email", identifier, password, name, mode = "login" } = req.body as {
        method?: LoginMethod;
        identifier?: string;
        password?: string;
        name?: string;
        mode?: "login" | "register";
      };
      if (method !== "email" && method !== "phone") return res.status(400).json({ error: "Choose email or phone" });
      if (!identifier || !password || password.length < 8) return res.status(400).json({ error: "Enter your identifier and a password of at least 8 characters" });
      const normalized = method === "email" ? normalizeEmail(identifier) : normalizePhone(identifier);
      if (method === "email" && !/^\S+@\S+\.\S+$/.test(normalized)) return res.status(400).json({ error: "Enter a valid email address" });
      if (method === "phone" && !validPhone(normalized)) return res.status(400).json({ error: "Enter a valid phone number with country code" });
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database is not available" });
      let user = await findUser(db, method, normalized);
      if (mode === "register") {
        if (!name?.trim()) return res.status(400).json({ error: "Enter your name" });
        if (user) return res.status(409).json({ error: "An account with this email or phone already exists" });
        await db.insert(users).values({
          openId: `${method}:${crypto.randomUUID()}`,
          name: name.trim(),
          email: method === "email" ? normalized : null,
          phoneNumber: method === "phone" ? normalized : null,
          loginMethod: method,
          passwordHash: await hashPassword(password),
          lastSignedIn: new Date(),
        });
        user = await findUser(db, method, normalized);
      } else {
        if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) return res.status(401).json({ error: "Invalid email/phone or password" });
        await db.update(users).set({ lastSignedIn: new Date() }).where(and(eq(users.id, user.id), method === "email" ? eq(users.email, normalized) : eq(users.phoneNumber, normalized)));
        user = await findUser(db, method, normalized);
      }
      if (!user) return res.status(500).json({ error: "Could not create account" });
      await signIn(res, user);
      res.json({ success: true });
    } catch (error) {
      console.error("[Custom Auth] Credentials auth failed", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie(COOKIE_NAME, getSessionCookieOptions(req));
    res.json({ success: true });
  });
}

export { userFromRequest };
