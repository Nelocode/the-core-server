import { Router } from 'express';
import multer from 'multer';
import { scanCard } from '../controllers/ocr.controller';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/scan', upload.single('image'), scanCard);

export default router;
