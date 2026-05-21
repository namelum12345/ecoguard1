import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

export const config = {
  port: Number(process.env.PORT) || 4100,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  citizenOrigin: process.env.CITIZEN_ORIGIN || 'http://localhost:5173',
  adminOrigin: process.env.ADMIN_ORIGIN || 'http://localhost:5174',
  appOrigin: process.env.APP_ORIGIN || 'http://localhost:8080',
  adminBootstrap: {
    email: process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@aquaguard.az',
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Admin123!',
  },
  paths: {
    root,
    db: path.join(root, 'data', 'aquaguard.db'),
    uploads: path.join(root, 'uploads'),
    citizenDist: path.join(root, '..', 'citizen-frontend', 'dist'),
    adminDist: path.join(root, '..', 'admin-panel', 'dist'),
  },
};
