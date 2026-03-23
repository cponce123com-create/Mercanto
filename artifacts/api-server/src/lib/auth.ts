import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");

export function signToken(payload: { userId: number; role: string }) {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: number; role: string };
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

  try {
    const [user] = await db
      .select({ id: usersTable.id, role: usersTable.role, isBlocked: usersTable.isBlocked })
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId))
      .limit(1);

    if (!user || user.isBlocked) {
      res.status(401).json({ error: "Unauthorized", message: "User not found or blocked" });
      return;
    }

    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch {
    res.status(500).json({ error: "Internal Server Error", message: "Auth check failed" });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
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

  try {
    const [user] = await db
      .select({ id: usersTable.id, role: usersTable.role, isBlocked: usersTable.isBlocked })
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId))
      .limit(1);

    if (!user || user.isBlocked) {
      res.status(401).json({ error: "Unauthorized", message: "User not found or blocked" });
      return;
    }
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Admin only" });
      return;
    }

    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch {
    res.status(500).json({ error: "Internal Server Error", message: "Auth check failed" });
  }
}

export async function requireVendor(req: Request, res: Response, next: NextFunction) {
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

  try {
    const [user] = await db
      .select({ id: usersTable.id, role: usersTable.role, isBlocked: usersTable.isBlocked })
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId))
      .limit(1);

    if (!user || user.isBlocked) {
      res.status(401).json({ error: "Unauthorized", message: "User not found or blocked" });
      return;
    }
    if (user.role !== "vendor" && user.role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Vendor only" });
      return;
    }

    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch {
    res.status(500).json({ error: "Internal Server Error", message: "Auth check failed" });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    }
  }
  next();
}
