import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerCustomAuthRoutes } from "./customAuth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sameOriginApiProtection } from "./csrf";
import { startMaterialJobRecovery } from "../materialPipeline";

async function startServer() {
  const app = express();
  const server = createServer(app);
  // 50 MiB audio grows to about 67 MiB when encoded; leave room for JSON framing.
  app.use(express.json({ limit: "72mb" }));
  app.use(express.urlencoded({ limit: "72mb", extended: true }));
  app.use("/api", sameOriginApiProtection);
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerCustomAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
    startMaterialJobRecovery();
  });
}

startServer().catch(error => { console.error(error); process.exit(1); });
