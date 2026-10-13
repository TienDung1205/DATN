import type { Request, Response } from 'express';
import * as appContextUtils from '../../utils/appContext.js';

type DatabaseHealthCheck = () => Promise<void>;

// [GET] /health
export const health = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Server is healthy',
      data: { status: 'ok' },
    });
  } catch {
    req.log.error({ event: 'health_check_failed' }, 'Health check failed');

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi hệ thống.',
    });
  }
};

// [GET] /ready
export const ready = async (req: Request, res: Response) => {
  try {
    const checkDatabase = appContextUtils.getAppValue<DatabaseHealthCheck>(
      req.app,
      'checkDatabase',
    );

    await checkDatabase();

    res.json({
      success: true,
      message: 'Service is ready',
      data: { status: 'ready' },
    });
  } catch {
    req.log.warn({ event: 'readiness_failed' }, 'Database is not ready');

    res.status(503).json({
      success: false,
      message: 'Dịch vụ chưa sẵn sàng.',
    });
  }
};
