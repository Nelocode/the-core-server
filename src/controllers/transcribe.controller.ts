import { Request, Response } from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const transcribeAudio = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // OpenAI Whisper expects a file on disk or a readable stream with a filename
    const tempFilePath = path.join(__dirname, `../../temp_${Date.now()}_${req.file.originalname}`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
    });

    // Cleanup
    fs.unlinkSync(tempFilePath);

    res.json({ text: transcription.text });
  } catch (error: any) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio', details: error.message });
  }
};
