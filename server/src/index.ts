import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initDb } from './db/pool';
import { registerListeners } from './events/notificationListener';

const PORT = process.env.PORT ?? 3001;

const start = async () => {
  try {
    await initDb();
    registerListeners();
    app.listen(PORT, () => {
      console.log(`✓ CivicTrack API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();