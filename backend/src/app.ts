import express from 'express';
import healthRouter from './routes/shared/health.routes.js';

const app = express();

app.disable('x-powered-by');
app.use(healthRouter);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

export default app;
