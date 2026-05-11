import express from 'express';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET } from '../config/auth';
import { AuthedRequest, AuthPayload } from '../types/auth';

export function authGuard(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    res.status(401).json({ ok: false, message: 'Unauthorized' });
    return;
  }

  try {
    req.user = jwt.verify(token, JWT_ACCESS_SECRET) as AuthPayload;
    next();
  } catch {
    res.status(401).json({ ok: false, message: 'Session expired' });
  }
}

export function adminGuard(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
  if (!req.user?.isAdmin) {
    res.status(403).json({ ok: false, message: 'Admin access required' });
    return;
  }

  next();
}
