import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[' + req.method + '] ' + req.path + ' - ' + err.message);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  if ((err as NodeJS.ErrnoException).name === 'MongoServerError') {
    res.status(409).json({ success: false, error: 'Duplicate entry' });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ success: false, error: 'Invalid ID format' });
    return;
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};