import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import ocrRoutes from './routes/ocr.routes';
import { investigateContact } from './controllers/investigate.controller';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ocr', ocrRoutes);

app.post('/api/investigate', investigateContact);

app.get('/', (req, res) => {
  res.json({ status: 'ok', engine: 'The Core Engine' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', engine: 'The Core Engine v1.0' });
});

app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`🚀 The Core Engine running on port ${PORT}`);
});

export { prisma };
