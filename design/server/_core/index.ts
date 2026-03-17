import "dotenv/config";
import express from "express";
import cors from "cors";
import { COOKIE_NAME } from "../../shared/const";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Enable CORS for the frontend origin so browser clients can call the API.
  // Adjust origin to your production frontend domain(s) as needed.
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "https://passmartshop.web.app",
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );
  // Lightweight auth logging: indicates whether the session cookie is present on incoming requests.
  app.use((req, _res, next) => {
    try {
      const cookieHeader = String(req.headers?.cookie || "");
      const hasCookieHeader = cookieHeader.length > 0;
      const hasSessionCookie = cookieHeader.includes(COOKIE_NAME);
      console.log("[Auth] incoming request", {
        method: req.method,
        url: req.url,
        hasCookieHeader,
        hasSessionCookie,
      });
    } catch (err) {
      console.error("[Auth] failed to read cookies", err);
    }
    next();
  });
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

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
