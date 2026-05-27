import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(morgan('dev'));
app.use(express.json());

// --- Health check ----------------------------------------
app.get('/api/health', async (_req, res) => {
  const mongo = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ok', mongo, timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.json({ message: 'VedaAI API', version: '1.0.0' });
});

// --- Connect MongoDB then start --------------------------
const start = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set in .env');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Atlas connected');
  app.listen(PORT, () => {
    console.log('Backend running on http://localhost:' + PORT);
    console.log('Health:  http://localhost:' + PORT + '/api/health');
  });
};

start().catch((err) => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});
