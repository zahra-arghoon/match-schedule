import express, { Application } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import userRoutes from './routes/userRoutes';
import authRotes from './routes/authRoutes';
import teamRoutes from './routes/teamRoutes';
import groupRoutes from './routes/groupRoutes';
import eventRoutes from './routes/eventRoutes';
import timingRoutes from './routes/timingRoutes';
import matchRoutes from './routes/matchRoutes';
import gapRoutes from './routes/gapRoutes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json'; // Path to the generated Swagger JSON file


// Load environment variables from .env file
config();

const app: Application = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());



// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Routes
app.use('/api/users', userRoutes);
app.use('/api', teamRoutes);
app.use('/api', groupRoutes);
app.use('/api', eventRoutes);
app.use('/api', timingRoutes);
app.use('/api', matchRoutes);
app.use('/api', gapRoutes);

app.use('', authRotes);
// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

export default app;