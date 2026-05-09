import { Request, Response } from 'express';
import OpenAI, { toFile } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const transcribeAudio = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const file = await toFile(req.file.buffer, req.file.originalname, { type: req.file.mimetype });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'es',
      prompt: 'Transcripción de notas de voz. El usuario está dictando información de un contacto.',
    });

    res.json({ text: transcription.text });
  } catch (error: any) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio', details: error.message });
  }
};
