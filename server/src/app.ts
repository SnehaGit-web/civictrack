import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import requestRoutes from './routes/requests';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';

const app = express();

app.use(cors({
  origin: [
    process.env.CLIENT_URL ?? 'http://localhost:5173',
    'https://civictrack.vercel.app',
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CivicTrack API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
