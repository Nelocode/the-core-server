import { Request, Response } from 'express';
import { prisma } from '../index';

// Helper to parse JSON fields safely
const parseJson = (str: string | null) => {
  if (!str) return undefined;
  try {
    return JSON.parse(str);
  } catch (e) {
    return undefined;
  }
};

// Helper to stringify JSON fields
const stringifyJson = (val: any) => {
  if (val === undefined || val === null) return null;
  return JSON.stringify(val);
};

export const getContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const formattedContacts = contacts.map(c => ({
      ...c,
      hobbies: c.hobbies ? c.hobbies.split(',').map(h => h.trim()) : [],
      family: parseJson(c.family),
      interactions: parseJson(c.interactions) || [],
      captureMetadata: parseJson(c.captureMetadata),
      intelligence: parseJson(c.intelligence)
    }));

    res.json(formattedContacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const contact = await prisma.contact.create({
      data: {
        id: data.id,
        name: data.name,
        role: data.role,
        company: data.company,
        email: data.email,
        website: data.website,
        phone: data.phone,
        avatar: data.avatar,
        location: data.location,
        birthday: data.birthday,
        category: data.category,
        relationshipScore: data.relationshipScore,
        notes: data.notes,
        hobbies: Array.isArray(data.hobbies) ? data.hobbies.join(', ') : data.hobbies,
        family: stringifyJson(data.family),
        interactions: stringifyJson(data.interactions),
        captureMetadata: stringifyJson(data.captureMetadata),
        intelligence: stringifyJson(data.intelligence)
      }
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role,
        company: data.company,
        email: data.email,
        website: data.website,
        phone: data.phone,
        avatar: data.avatar,
        location: data.location,
        birthday: data.birthday,
        category: data.category,
        relationshipScore: data.relationshipScore,
        notes: data.notes,
        hobbies: Array.isArray(data.hobbies) ? data.hobbies.join(', ') : data.hobbies,
        family: stringifyJson(data.family),
        interactions: stringifyJson(data.interactions),
        captureMetadata: stringifyJson(data.captureMetadata),
        intelligence: stringifyJson(data.intelligence)
      }
    });

    res.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.contact.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};
