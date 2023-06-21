import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { authRouter } from './routes/auth';

export const createApp = () => {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(morgan('tiny'));

  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to Spoons API.' });
  });

  // routes
  app.use('/api/auth', authRouter);

  return app;
};
