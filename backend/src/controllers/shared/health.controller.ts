import type { RequestHandler } from 'express';

export const health: RequestHandler = (_req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    data: { status: 'ok' },
  });
};
