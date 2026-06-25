import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_ACCESS_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as unknown as { role: string };
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ statusCode: 403, message: 'Forbidden' });
    }
    next();
  } catch {
    return res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
  }
}
