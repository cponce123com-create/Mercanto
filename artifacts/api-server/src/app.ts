import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { apiLimiter } from "./middlewares/rateLimiter.js";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(helmet());

// Build the list of allowed origins from env vars
function buildAllowedOrigins(): string[] {
  const origins: string[] = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
  ];

  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    frontendUrl.split(",").forEach(o => {
      const trimmed = o.trim();
      if (trimmed) origins.push(trimmed);
    });
  }

  const replitDomain = process.env.REPLIT_DEV_DOMAIN;
  if (replitDomain) {
    origins.push(`https://${replitDomain}`);
  }

  logger.info({ origins }, "CORS allowed origins configured");

  return origins;
}

const allowedOrigins = buildAllowedOrigins();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server, Vite proxy, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (
      origin.endsWith(".replit.dev") ||
      origin.endsWith(".repl.co") ||
      origin.endsWith(".replit.app") ||
      origin.endsWith(".onrender.com") ||
      origin.endsWith(".render.com")
    ) {
      callback(null, true);
    } else {
      logger.warn({ origin }, "CORS: Origin not allowed");
      callback(new Error(`CORS: Origin not allowed: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiLimiter);
app.use("/api", router);

export default app;
