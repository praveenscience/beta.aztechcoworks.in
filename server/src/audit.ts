// Audit logging middleware — logs write operations (POST/PATCH/DELETE)

import type { RequestHandler } from "express";
import { db } from "./store.js";

export function auditLog(action: string, entityType: string): RequestHandler {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only log successful writes
      if (res.statusCode < 400 && req.session.userId) {
        const entityId = body?.id || req.params.id || req.params.leadId || undefined;
        db.auditLogs.insert({
          userId: req.session.userId,
          action,
          entityType,
          entityId,
          detail: JSON.stringify({
            method: req.method,
            path: req.originalUrl,
            ...(req.method !== "GET" && req.body ? { body: req.body } : {}),
          }).slice(0, 2000),
        });
      }
      return originalJson(body);
    };
    next();
  };
}
