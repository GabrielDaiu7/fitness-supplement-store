import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { getCorsOrigins } from './config/auth';
import { accountRouter, adminRouter } from './modules/admin.routes';
import authRouter from './modules/auth.routes';
import publicRouter from './modules/public.routes';

export function createApp() {
  const app = express();

  app.use(cors({ origin: getCorsOrigins(), credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api', publicRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/account', accountRouter);
  app.use('/api/admin', adminRouter);

  return app;
}
