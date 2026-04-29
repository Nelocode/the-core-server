import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import ocrRoutes from './routes/ocr.routes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ocr', ocrRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', engine: 'The Core Engine v1.0' });
});

app.listen(PORT, () => {
  console.log(`🚀 The Core Engine running on port ${PORT}`);
});

export { prisma };
