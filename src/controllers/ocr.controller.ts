import { Request, Response } from 'express';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // 2. Read file as base64
    const imageBuffer = fs.readFileSync(optimizedPath);
    const base64Image = imageBuffer.toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    // 3. Call OpenAI Vision API
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured on server');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert OCR AI designed to extract information from business cards.
Analyze the image of the business card and extract the following information.
You must return ONLY a valid JSON object matching this exact structure, with no markdown formatting or extra text:
{
  "name": "Full Name",
  "role": "Job Title",
  "company": "Company Name",
  "email": "Email Address",
  "phone": "Phone Number"
}
If any field is missing or cannot be read, return null for that field. Do not make up information.`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the details from this business card.' },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response');
    }

    const result = JSON.parse(content);

    // 4. Cleanup
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
