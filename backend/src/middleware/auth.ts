import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type Role = "ADMIN" | "MEMBER";

export type AuthPayload = {
  userId: string;
  role: Role;
  email?: string;
  memberId?: string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

function normalizeRole(role?: string): Role {
  const r = (role || "").toUpperCase();
  if (r === "MEMBER") return "MEMBER";
  return "ADMIN";
}

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ message: "Oturum gerekli" });
    return;
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload & { role?: string };
    req.auth = {
      userId: decoded.userId,
      role: normalizeRole(decoded.role),
      email: decoded.email,
      memberId: decoded.memberId || (normalizeRole(decoded.role) === "MEMBER" ? decoded.userId : undefined),
    };
    next();
  } catch {
    res.status(401).json({ message: "Geçersiz oturum" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.auth?.role !== "ADMIN") {
      res.status(403).json({ message: "Bu işlem için yönetici yetkisi gerekli" });
      return;
    }
    next();
  });
}

export function requireMember(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.auth?.role !== "MEMBER" || !req.auth.memberId) {
      res.status(403).json({ message: "Bu işlem için üye girişi gerekli" });
      return;
    }
    next();
  });
}
