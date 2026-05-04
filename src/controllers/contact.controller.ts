import { Request, Response } from 'express';
import { prisma } from '../index';

// Helper to parse JSON fields safely
const parseJson = (str: string | null) => {
  if (!str) return undefined;
  try { return JSON.parse(str); } catch { return undefined; }
};

// Helper to stringify JSON fields
const stringifyJson = (val: any) => {
  if (val === undefined || val === null) return null;
  return JSON.stringify(val);
};

// Format a raw Prisma contact into the shape the frontend expects
const formatContact = (c: any) => ({
  ...c,
  hobbies: c.hobbies ? c.hobbies.split(',').map((h: string) => h.trim()).filter(Boolean) : [],
  family: parseJson(c.family),
  interactions: parseJson(c.interactions) || [],
  captureMetadata: parseJson(c.captureMetadata),
  intelligence: parseJson(c.intelligence)
});

export const getContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await prisma.contact.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(contacts.map(formatContact));
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.name || !data.name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const contact = await prisma.contact.create({
      data: {
        id: data.id,
        name: data.name.trim(),
        role: data.role || '',
        company: data.company || '',
        email: data.email || '',
        website: data.website,
        phone: data.phone,
        avatar: data.avatar,
        location: data.location || '',
        birthday: data.birthday,
        category: data.category,
        relationshipScore: data.relationshipScore ?? 50,
        notes: data.notes || '',
        hobbies: Array.isArray(data.hobbies) ? data.hobbies.join(', ') : (data.hobbies || ''),
        family: stringifyJson(data.family),
        interactions: stringifyJson(data.interactions || []),
        captureMetadata: stringifyJson(data.captureMetadata),
        intelligence: stringifyJson(data.intelligence)
      }
    });

    res.status(201).json(formatContact(contact));
  } catch (error: any) {
    console.error('Error creating contact:', error);
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'A contact with this ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create contact' });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (!data.name || !data.name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: data.name.trim(),
        role: data.role || '',
        company: data.company || '',
        email: data.email || '',
        website: data.website,
        phone: data.phone,
        avatar: data.avatar,
        location: data.location || '',
        birthday: data.birthday,
        category: data.category,
        relationshipScore: data.relationshipScore ?? 50,
        notes: data.notes || '',
        hobbies: Array.isArray(data.hobbies) ? data.hobbies.join(', ') : (data.hobbies || ''),
        family: stringifyJson(data.family),
        interactions: stringifyJson(data.interactions || []),
        captureMetadata: stringifyJson(data.captureMetadata),
        intelligence: stringifyJson(data.intelligence)
      }
    });

    res.json(formatContact(contact));
  } catch (error: any) {
    console.error('Error updating contact:', error);
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.contact.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    if (error?.code === 'P2025') {
      // Already deleted — idempotent response
      return res.status(204).send();
    }
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};
