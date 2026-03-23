import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { sendWelcomeEmail } from "../services/email.js";

const router: IRouter = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, district } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Bad Request", message: "name, email, password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Bad Request", message: "La contraseña debe tener al menos 8 caracteres" });
      return;
    }
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Bad Request", message: "Email already in use" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      name, email, passwordHash, phone, district, role: "user"
    }).returning();
    const token = signToken({ userId: user.id, role: user.role });
    const { passwordHash: _h, ...userPublic } = user;
    res.cookie("mercanto_token", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 30 * 24 * 60 * 60 * 1000 });
    sendWelcomeEmail(user.email, user.name).catch(() => {});
    res.json({ user: { ...userPublic, isBlocked: user.isBlocked ?? false } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Registration failed" });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Bad Request", message: "email and password required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }
    if (user.isBlocked) {
      res.status(401).json({ error: "Unauthorized", message: "User is blocked" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }
    await db.update(usersTable).set({ lastSignedIn: new Date() }).where(eq(usersTable.id, user.id));
    const token = signToken({ userId: user.id, role: user.role });
    const { passwordHash: _h, ...userPublic } = user;
    res.cookie("mercanto_token", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({ user: { ...userPublic, isBlocked: user.isBlocked ?? false } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Login failed" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("mercanto_token");
  res.json({ success: true, message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "User not found" });
      return;
    }
    const { passwordHash: _h, ...userPublic } = user;
    res.json({ ...userPublic, isBlocked: user.isBlocked ?? false });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get user" });
  }
});

router.put("/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone, district, avatarUrl, dniNumber, dniFrontUrl, dniFrontPublicId, dniBackUrl, dniBackPublicId } = req.body;
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (district !== undefined) updateData.district = district;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (dniNumber !== undefined) updateData.dniNumber = dniNumber;
    if (dniFrontUrl !== undefined) updateData.dniFrontUrl = dniFrontUrl;
    if (dniFrontPublicId !== undefined) updateData.dniFrontPublicId = dniFrontPublicId;
    if (dniBackUrl !== undefined) updateData.dniBackUrl = dniBackUrl;
    if (dniBackPublicId !== undefined) updateData.dniBackPublicId = dniBackPublicId;
    const [updated] = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, userId))
      .returning();
    const { passwordHash: _h, ...userPublic } = updated;
    res.json({ ...userPublic, isBlocked: updated.isBlocked ?? false });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Update failed" });
  }
});

export default router;
