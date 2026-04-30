import { Request, Response } from 'express';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const scanCard = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No images provided' });
  }

  const optimizedPaths: string[] = [];
  const imageUrls: any[] = [];

  try {
    // Process each file
    for (const file of files) {
      const optimizedPath = path.join('uploads', `optimized-${file.filename}.jpg`);
      optimizedPaths.push(optimizedPath);

      // 1. Optimize image using Sharp
      await sharp(file.path)
        .resize(1000) // Resize to 1000px width
        .jpeg({ quality: 80 })
        .toFile(optimizedPath);

      // 2. Read file as base64
      const imageBuffer = fs.readFileSync(optimizedPath);
      const base64Image = imageBuffer.toString('base64');
      imageUrls.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`,
          detail: 'high'
        }
      });
    }

    // 3. Call OpenAI Vision API
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured on server');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert OCR AI designed to extract information from business cards. You may receive 1 or 2 images (front and back of the card).
Analyze all the images and combine the information to extract the following fields.
You must return ONLY a valid JSON object matching this exact structure, with no markdown formatting or extra text:
{
  "name": "Full Name",
  "role": "Job Title",
  "company": "Company Name",
  "email": "Email Address",
  "website": "Company Website URL or Personal Website",
  "phone": "Phone Number",
  "location": "Physical Address or City/Country"
}
If any field is missing or cannot be read across all images, return null for that field. Do not make up information.`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the details from this business card (images include front and potentially back).' },
            ...imageUrls
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
    for (const file of files) fs.unlinkSync(file.path);
    for (const p of optimizedPaths) fs.unlinkSync(p);

    res.json(result);
  } catch (error: any) {
    console.error('OCR Controller Error:', error);
    
    // Cleanup on error
    if (files) {
      for (const file of files) if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
    for (const p of optimizedPaths) if (fs.existsSync(p)) fs.unlinkSync(p);

    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
