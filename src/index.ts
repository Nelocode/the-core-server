import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import ocrRoutes from './routes/ocr.routes';
import transcribeRoutes from './routes/transcribe.routes';
import contactRoutes from './routes/contact.routes';
import { investigateContact } from './controllers/investigate.controller';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '80', 10);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/ocr', ocrRoutes);
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/contacts', contactRoutes);
app.post('/api/investigate', investigateContact);

app.get('/', (req, res) => {
  res.json({ status: 'ok', engine: 'The Core Engine v1.5' });
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', engine: 'The Core Engine v1.5', db: 'connected', timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'error', engine: 'The Core Engine v1.5', db: 'disconnected' });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 The Core Engine running on port ${PORT}`);
  console.log(`📦 Database: ${process.env.DATABASE_URL}`);
});

// Graceful shutdown — prevents SIGTERM crash loops in Docker
const shutdown = async (signal: string) => {
  console.log(`\n[Core Engine] ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[Core Engine] Shutdown complete.');
    process.exit(0);
  });
  // Force exit after 10s if graceful shutdown fails
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { prisma };
