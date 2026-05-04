"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanCard = void 0;
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const scanCard = async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
    }
    const optimizedPaths = [];
    const imageUrls = [];
    try {
        // Process each file
        for (const file of files) {
            const optimizedPath = path_1.default.join('uploads', `optimized-${file.filename}.jpg`);
            optimizedPaths.push(optimizedPath);
            // 1. Optimize image using Sharp
            await (0, sharp_1.default)(file.path)
                .resize(1000) // Resize to 1000px width
                .jpeg({ quality: 80 })
                .toFile(optimizedPath);
            // 2. Read file as base64
            const imageBuffer = fs_1.default.readFileSync(optimizedPath);
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
        for (const file of files)
            fs_1.default.unlinkSync(file.path);
        for (const p of optimizedPaths)
            fs_1.default.unlinkSync(p);
        res.json(result);
    }
    catch (error) {
        console.error('OCR Controller Error:', error);
        // Cleanup on error
        if (files) {
            for (const file of files)
                if (fs_1.default.existsSync(file.path))
                    fs_1.default.unlinkSync(file.path);
        }
        for (const p of optimizedPaths)
            if (fs_1.default.existsSync(p))
                fs_1.default.unlinkSync(p);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.scanCard = scanCard;
