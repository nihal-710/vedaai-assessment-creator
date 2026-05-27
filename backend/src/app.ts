import express      from 'express';
import cors         from 'cors';
import helmet       from 'helmet';
import morgan       from 'morgan';
import { env }      from './config/env';
import healthRouter     from './routes/health.routes';
import assignmentRouter from './routes/assignment.routes';
import resultRouter     from './routes/result.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// --- Security & parsing --------------------------------------------------------
app.use(helmet());
app.use(cors({
  origin:      env.FRONTEND_URL,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// --- Routes -------------------------------------------------------------------
app.use('/api',             healthRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/results',     resultRouter);

// --- 404 ----------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// --- Global error handler -----------------------------------------------------
app.use(errorHandler);

export default app;
