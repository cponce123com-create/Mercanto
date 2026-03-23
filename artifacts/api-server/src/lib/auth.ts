import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mercanto-dev-secret-2024";

export function signToken(payload: { userId: number; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    return decoded;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/mercanto_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "No token provided" });
    return;
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid token" });
    return;
  }
  (req as any).userId = decoded.userId;
  (req as any).userRole = decoded.role;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    if ((req as any).userRole !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Admin only" });
      return;
    }
    next();
  });
}

export async function requireVendor(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    const role = (req as any).userRole;
    if (role !== "vendor" && role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Vendor only" });
      return;
    }
    next();
  });
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      (req as any).userId = decoded.userId;
      (req as any).userRole = decoded.role;
    }
  }
  next();
}
