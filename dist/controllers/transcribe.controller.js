"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeAudio = void 0;
const openai_1 = __importDefault(require("openai"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const transcribeAudio = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }
        // OpenAI Whisper expects a file on disk or a readable stream with a filename
        const tempFilePath = path_1.default.join(__dirname, `../../temp_${Date.now()}_${req.file.originalname}`);
        fs_1.default.writeFileSync(tempFilePath, req.file.buffer);
        const transcription = await openai.audio.transcriptions.create({
            file: fs_1.default.createReadStream(tempFilePath),
            model: 'whisper-1',
        });
        // Cleanup
        fs_1.default.unlinkSync(tempFilePath);
        res.json({ text: transcription.text });
    }
    catch (error) {
        console.error('Transcription error:', error);
        res.status(500).json({ error: 'Failed to transcribe audio', details: error.message });
    }
};
exports.transcribeAudio = transcribeAudio;
