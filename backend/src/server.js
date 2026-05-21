import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { bootstrapAdmin } from './db.js';
import authRoutes from './routes/auth.routes.js';
import reportRoutes from './routes/reports.routes.js';
import userRoutes from './routes/users.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

const allowedOrigins = [config.citizenOrigin, config.adminOrigin, config.appOrigin].filter(Boolean);
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    // dev modeda localhost:* hamısına icazə ver
    if (isDev && /^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    console.error('[cors] blocked origin:', origin, '| allowed:', allowedOrigins);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(config.paths.uploads, {
  fallthrough: true,
  maxAge: '7d',
}));

const apiRouter = express.Router();
apiRouter.get('/health', (_req, res) => res.json({ ok: true }));
apiRouter.use('/auth', authRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use(notFound);

app.use('/api', apiRouter);

function distReady(dir) {
  return fs.existsSync(path.join(dir, 'index.html'));
}

const serveFrontends =
  distReady(config.paths.citizenDist) && distReady(config.paths.adminDist);

if (serveFrontends) {
  const { citizenDist, adminDist } = config.paths;

  app.get('/admin', (_req, res) => res.redirect(302, '/admin/'));

  app.use('/admin', express.static(adminDist));
  app.use('/admin', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.sendFile(path.join(adminDist, 'index.html'), (err) => next(err));
  });

  app.use(express.static(citizenDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.sendFile(path.join(citizenDist, 'index.html'), (err) => next(err));
  });
}

app.use(notFound);
app.use(errorHandler);

bootstrapAdmin();

app.listen(config.port, () => {
  const host = config.port === 80 || config.port === 443 ? '' : `:${config.port}`;
  console.log(`[server] API http://localhost${host}/api/health`);
  if (serveFrontends) {
    console.log(`[server] Vətəndaş  http://localhost${host}/`);
    console.log(`[server] Admin     http://localhost${host}/admin/`);
  } else {
    console.warn('[server] Frontend dist tapılmadı — yalnız API. Əvvəl kökdən: npm run build');
  }
});
