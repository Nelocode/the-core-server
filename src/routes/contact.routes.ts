import { Router } from 'express';
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact
} from '../controllers/contact.controller';

const router = Router();

router.get('/', getContacts);
router.get('/:id', getContactById);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
