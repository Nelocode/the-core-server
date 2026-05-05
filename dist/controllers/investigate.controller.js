"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.investigateContact = void 0;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const investigateContact = async (req, res) => {
    try {
        const { name, company, role, location, website } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required for investigation' });
        }
        const tavilyKey = process.env.TAVILY_API_KEY;
        let searchResults = '';
        // 1. Perform Web Search with Tavily if available
        if (tavilyKey) {
            try {
                // Helper function to safely escape quotes to prevent query injection
                const safeQuery = (val) => val ? `"${val.replace(/"/g, '')}"` : '';
                // Extract a safe hostname for the website (no paths, schemas, or special search operators)
                let safeWebsite = '';
                if (website) {
                    try {
                        const parsedUrl = new URL(website.startsWith('http') ? website : `https://${website}`);
                        safeWebsite = parsedUrl.hostname;
                    }
                    catch (e) {
                        safeWebsite = ''; // Ignore invalid URLs
                    }
                }
                const roleStr = safeQuery(role);
                const companyStr = safeQuery(company);
                const locationStr = safeQuery(location);
                const websiteStr = safeWebsite ? `site:${safeWebsite} OR "${safeWebsite}"` : '';
                // Create a highly precise query string avoiding empty quotes
                const queryParts = [safeQuery(name), roleStr, companyStr, locationStr, websiteStr, 'professional profile bio linkedin'];
                const query = queryParts.filter(Boolean).join(' ');
                const tavilyResponse = await fetch('https://api.tavily.com/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        api_key: tavilyKey,
                        query,
                        search_depth: 'basic',
                        include_answer: true,
                        max_results: 3
                    }),
                });
                if (tavilyResponse.ok) {
                    const searchData = await tavilyResponse.json();
                    searchResults = `Answer: ${searchData.answer}\nResults: ${searchData.results.map((r) => r.content).join('\n')}`;
                }
            }
            catch (searchError) {
                console.error('Tavily search failed:', searchError);
            }
        }
        // 2. Synthesize using OpenAI
        const systemPrompt = `You are a high-level executive assistant AI. 
Analyze the provided web search context about the person "${name}" 
${company ? `from the company "${company}"` : ''} 
${role ? `with the role of "${role}"` : ''} 
${location ? `based in "${location}"` : ''}
${website ? `associated with website "${website}"` : ''}.
Extract or infer the following details to build a highly precise CRM profile.
You must return ONLY a valid JSON object matching this exact structure:
{
  "avatar": "url to a profile picture if found, otherwise null",
  "location": "Physical location or city/country (string or null)",
  "hobbies": ["array of strings representing hobbies, passions or interests. Infer if not explicitly stated (e.g. Golf, Tech)"],
  "notes": "A brief summary of their current professional focus, recent news, or an interesting fact",
  "role": "Their exact current job title if found, otherwise null",
  "icebreaker": "A specific sentence or topic to break the ice based on their hobbies or notes. E.g. 'I saw you are into Golf, did you catch the Masters?'"
}`;
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: searchResults ? `Search context:\n${searchResults}` : `No internet connection. Use your pre-trained knowledge to infer a likely executive profile for ${name} at ${company || 'Unknown'}.` }
            ],
            response_format: { type: "json_object" }
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('OpenAI returned empty content');
        }
        const parsedData = JSON.parse(content);
        res.json(parsedData);
    }
    catch (error) {
        console.error('Investigate Controller Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.investigateContact = investigateContact;
