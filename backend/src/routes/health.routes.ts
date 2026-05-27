import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const mongo = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(mongo === 'connected' ? 200 : 503).json({
    success:   true,
    status:    mongo === 'connected' ? 'ok' : 'degraded',
    mongo,
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV,
  });
});

export default router;
