import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import type { ROLES } from "../types";

const auth = (...roles: ROLES[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({ success: false, message: "Unauthorized — no token provided" });
        return;
      }
      const decoded = jwt.verify(token, config.secret) as JwtPayload;

      if (roles.length && !roles.includes(decoded.role as ROLES)) {
        res.status(403).json({ success: false, message: "Forbidden — insufficient permissions" });
        return;
      }
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  };
};

export default auth;