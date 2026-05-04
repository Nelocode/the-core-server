"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteContact = exports.updateContact = exports.createContact = exports.getContactById = exports.getContacts = void 0;
const index_1 = require("../index");
// ─── Helpers ─────────────────────────────────────────────────────────────────
const contactInclude = {
    organization: true,
    tags: { include: { tag: true } },
    notes: { orderBy: { isPinned: 'desc', createdAt: 'desc' } },
    interactions: { orderBy: { date: 'desc' }, take: 10 },
    meetings: { include: { meeting: true } }
};
const formatContact = (c) => ({
    ...c,
    hobbies: c.hobbies ? c.hobbies.split(',').map((h) => h.trim()).filter(Boolean) : [],
    aiKeyInterests: c.aiKeyInterests ? c.aiKeyInterests.split(',').map((i) => i.trim()).filter(Boolean) : [],
    tags: c.tags?.map((ct) => ct.tag) ?? [],
    // Legacy-compatible shape for the frontend
    company: c.organization?.name ?? null,
    website: c.organization?.website ?? null,
    interactions: c.interactions ?? [],
    family: c.spouseName || c.childrenCount
        ? { spouse: c.spouseName, children: c.childrenCount }
        : null,
    intelligence: {
        icebreaker: c.aiIcebreaker,
        strategicContext: c.aiStrategicContext,
        sentiment: c.aiSentiment,
        keyInterests: c.aiKeyInterests ? c.aiKeyInterests.split(',').map((i) => i.trim()) : []
    },
    captureMetadata: c.capturedAt ? {
        capturedAt: c.capturedAt,
        meetingLocation: c.captureLocation,
        latitude: c.captureLat,
        longitude: c.captureLng,
        source: c.captureSource
    } : null
});
// ─── Handlers ────────────────────────────────────────────────────────────────
const getContacts = async (req, res) => {
    try {
        const contacts = await index_1.prisma.contact.findMany({
            include: contactInclude,
            orderBy: { createdAt: 'desc' }
        });
        res.json(contacts.map(formatContact));
    }
    catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
};
exports.getContacts = getContacts;
const getContactById = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await index_1.prisma.contact.findUnique({
            where: { id },
            include: {
                ...contactInclude,
                interactions: { orderBy: { date: 'desc' } }, // All interactions for detail view
                notes: { orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] }
            }
        });
        if (!contact)
            return res.status(404).json({ error: 'Contact not found' });
        res.json(formatContact(contact));
    }
    catch (error) {
        console.error('Error fetching contact:', error);
        res.status(500).json({ error: 'Failed to fetch contact' });
    }
};
exports.getContactById = getContactById;
const createContact = async (req, res) => {
    try {
        const data = req.body;
        if (!data.name?.trim())
            return res.status(400).json({ error: 'Name is required' });
        // Handle organization: resolve by ID or create by name
        let organizationId = data.organizationId ?? null;
        if (!organizationId && data.company?.trim()) {
            const org = await index_1.prisma.organization.upsert({
                where: { name: data.company.trim() },
                update: {},
                create: { name: data.company.trim(), website: data.website }
            });
            organizationId = org.id;
        }
        const contact = await index_1.prisma.contact.create({
            data: {
                id: data.id,
                name: data.name.trim(),
                email: data.email ?? null,
                phone: data.phone ?? null,
                avatar: data.avatar ?? null,
                birthday: data.birthday ?? null,
                location: data.location ?? null,
                linkedin: data.linkedin ?? null,
                twitter: data.twitter ?? null,
                role: data.role ?? null,
                department: data.department ?? null,
                seniority: data.seniority ?? null,
                relationshipScore: data.relationshipScore ?? 50,
                engagementLevel: data.engagementLevel ?? null,
                communicationStyle: data.communicationStyle ?? null,
                preferredChannel: data.preferredChannel ?? null,
                spouseName: data.family?.spouse ?? null,
                childrenCount: data.family?.children?.length ?? null,
                hobbies: Array.isArray(data.hobbies) ? data.hobbies.join(', ') : (data.hobbies ?? null),
                personalNotes: data.notes ?? null,
                aiIcebreaker: data.intelligence?.icebreaker ?? null,
                aiStrategicContext: data.intelligence?.strategicContext ?? null,
                aiSentiment: data.intelligence?.sentiment ?? null,
                aiKeyInterests: Array.isArray(data.intelligence?.keyInterests)
                    ? data.intelligence.keyInterests.join(', ')
                    : null,
                capturedAt: data.captureMetadata?.capturedAt ? new Date(data.captureMetadata.capturedAt) : null,
                captureSource: data.captureMetadata?.source ?? data.captureSource ?? null,
                captureLocation: data.captureMetadata?.meetingLocation ?? null,
                captureLat: data.captureMetadata?.latitude ?? null,
                captureLng: data.captureMetadata?.longitude ?? null,
                organizationId
            },
            include: contactInclude
        });
        res.status(201).json(formatContact(contact));
    }
    catch (error) {
        console.error('Error creating contact:', error);
        if (error?.code === 'P2002')
            return res.status(409).json({ error: 'Contact with this ID already exists' });
        res.status(500).json({ error: 'Failed to create contact' });
    }
};
exports.createContact = createContact;
const updateContact = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        if (!data.name?.trim())
            return res.status(400).json({ error: 'Name is required' });
        let organizationId = data.organizationId;
        if (!organizationId && data.company?.trim()) {
            const org = await index_1.prisma.organization.upsert({
                where: { name: data.company.trim() },
                update: {},
                create: { name: data.company.trim(), website: data.website }
            });
            organizationId = org.id;
        }
        const contact = await index_1.prisma.contact.update({
            where: { id },
            data: {
                name: data.name.trim(),
                email: data.email ?? null,
                phone: data.phone ?? null,
                avatar: data.avatar ?? null,
                birthday: data.birthday ?? null,
                location: data.location ?? null,
                linkedin: data.linkedin ?? null,
                twitter: data.twitter ?? null,
                role: data.role ?? null,
                department: data.department ?? null,
                seniority: data.seniority ?? null,
                relationshipScore: data.relationshipScore ?? 50,
                engagementLevel: data.engagementLevel ?? null,
                communicationStyle: data.communicationStyle ?? null,
                preferredChannel: data.preferredChannel ?? null,
                spouseName: data.family?.spouse ?? null,
                childrenCount: data.family?.children?.length ?? null,
                hobbies: Array.isArray(data.hobbies) ? data.hobbies.join(', ') : (data.hobbies ?? null),
                personalNotes: data.notes ?? null,
                aiIcebreaker: data.intelligence?.icebreaker ?? null,
                aiStrategicContext: data.intelligence?.strategicContext ?? null,
                aiSentiment: data.intelligence?.sentiment ?? null,
                aiKeyInterests: Array.isArray(data.intelligence?.keyInterests)
                    ? data.intelligence.keyInterests.join(', ')
                    : null,
                capturedAt: data.captureMetadata?.capturedAt ? new Date(data.captureMetadata.capturedAt) : null,
                captureSource: data.captureMetadata?.source ?? null,
                captureLocation: data.captureMetadata?.meetingLocation ?? null,
                captureLat: data.captureMetadata?.latitude ?? null,
                captureLng: data.captureMetadata?.longitude ?? null,
                organizationId: organizationId ?? null
            },
            include: contactInclude
        });
        res.json(formatContact(contact));
    }
    catch (error) {
        console.error('Error updating contact:', error);
        if (error?.code === 'P2025')
            return res.status(404).json({ error: 'Contact not found' });
        res.status(500).json({ error: 'Failed to update contact' });
    }
};
exports.updateContact = updateContact;
const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        await index_1.prisma.contact.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting contact:', error);
        if (error?.code === 'P2025')
            return res.status(204).send();
        res.status(500).json({ error: 'Failed to delete contact' });
    }
};
exports.deleteContact = deleteContact;
