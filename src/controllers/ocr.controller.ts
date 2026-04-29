import { Request, Response } from 'express';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const N8N_SCAN_URL = process.env.N8N_SCAN_CARD_URL;

export const scanCard = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const filePath = req.file.path;
  const optimizedPath = path.join('uploads', `optimized-${req.file.filename}.jpg`);

  try {
    // 1. Optimize image using Sharp
    await sharp(filePath)
      .resize(1000) // Resize to 1000px width
      .jpeg({ quality: 80 })
      .toFile(optimizedPath);

    // 2. Prepare for n8n call
    if (!N8N_SCAN_URL) {
      throw new Error('N8N_SCAN_CARD_URL not configured on server');
    }

    // Convert optimized image to base64 or send as FormData
    const imageBuffer = fs.readFileSync(optimizedPath);
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'card.jpg');

    const n8nResponse = await fetch(N8N_SCAN_URL, {
      method: 'POST',
      body: formData
    });

    if (!n8nResponse.ok) {
      throw new Error('n8n processing failed');
    }

    const result = await n8nResponse.json();

    // 3. Cleanup
    fs.unlinkSync(filePath);
    fs.unlinkSync(optimizedPath);

    res.json(result);
  } catch (error: any) {
    console.error('OCR Controller Error:', error);
    
    // Cleanup on error
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(optimizedPath)) fs.unlinkSync(optimizedPath);

    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
