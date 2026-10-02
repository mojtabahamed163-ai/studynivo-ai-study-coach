// Application configuration. Custom authentication is intentionally independent
// from Manus and uses the provider credentials listed in .env.example.
export const ENV = {
  get appId() { return process.env.MANUS_PROJECT_ID ?? ""; },
  get cookieSecret() { return process.env.AUTH_SESSION_SECRET ?? process.env.MANUS_JWT_SECRET ?? ""; },
  get databaseUrl() { return process.env.DATABASE_URL ?? ""; },
  get oAuthServerUrl() { return process.env.MANUS_OAUTH_API_URL ?? ""; },
  get ownerOpenId() { return process.env.OWNER_OPEN_ID ?? ""; },
  get isProduction() { return process.env.NODE_ENV === "production"; },
  get forgeApiUrl() { return process.env.MANUS_API_URL ?? ""; },
  get forgeApiKey() { return process.env.MANUS_API_KEY ?? ""; },
};
