import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import apiRouter from './routes/api';

const app = express();

// 1. Helmet Security Middleware
app.set('trust proxy', 1); // Trust first proxy (e.g. Nginx, CloudFront) to get real client IPs for rate-limiting

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. CORS configurations
app.use(cors({
  origin: '*', // Allow all client connections in MVP. Can be restricted to specific domains in prod.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Rate Limiter Middleware to avoid DDoS and brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
  message: {
    message: 'Too many requests. Try again later.'
  }
});
app.use('/api', limiter);

// 4. Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Expose uploaded reports folder statically (for file access)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 6. Bind Master Router
app.use('/api', apiRouter);

// 7. Base healthcheck
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/ip', (req, res) => {
  res.json({
    ip: req.ip,
    forwarded: req.headers['x-forwarded-for']
  });
});

// 8. Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);

  const status = err.status || 500;
  const message = err.message || 'An unexpected server error occurred.';

  res.status(status).json({
    status: 'error',
    message
  });
});

export default app;
