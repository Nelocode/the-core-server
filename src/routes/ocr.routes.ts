import { Router } from 'express';
import multer from 'multer';
import { scanCard } from '../controllers/ocr.controller';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/scan', upload.array('images', 2), scanCard);

export default router;
