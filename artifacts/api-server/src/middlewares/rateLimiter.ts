import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos",
    message: "Has excedido el límite de intentos. Por favor, espera 15 minutos antes de intentarlo de nuevo.",
  },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Límite de solicitudes excedido",
    message: "Has excedido el límite de solicitudes. Por favor, espera 15 minutos.",
  },
});
