import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import { globalErrorHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimiter';
import compression from 'compression';

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(apiLimiter);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Authentication service is running' });
});

app.use('/auth', authRoutes);

app.use(globalErrorHandler);

export default app;
