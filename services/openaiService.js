const https = require('https');

// Groq is free, fast, and requires no credit card
// Models: llama-3.3-70b-versatile, llama3-8b-8192 (faster/lighter)
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Helper to call Groq API (OpenAI-compatible format)
const callGroq = (systemPrompt, userPrompt) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    const options = {
      hostname: 'api.groq.com',
      path:     '/openai/v1/chat/completions',
      method:   'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(`Groq API error: ${parsed.error.message}`));
          const text = parsed.choices?.[0]?.message?.content || '';
          resolve(text.trim());
        } catch (e) {
          reject(new Error('Failed to parse Groq response: ' + data.slice(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

// Robustly extract JSON from response (handles markdown fences, extra text)
const extractJSON = (raw) => {
  try { return JSON.parse(raw); } catch {}

  let clean = raw
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  try { return JSON.parse(clean); } catch {}

  const start = raw.indexOf('{');
  const end   = raw.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(raw.slice(start, end + 1)); } catch {}
  }

  const aStart = raw.indexOf('[');
  const aEnd   = raw.lastIndexOf(']');
  if (aStart !== -1 && aEnd > aStart) {
    try { return JSON.parse(raw.slice(aStart, aEnd + 1)); } catch {}
  }

  throw new Error('Could not extract valid JSON from response. Raw: ' + raw.slice(0, 300));
};

// Generate a full day-by-day travel itinerary
const generateItinerary = async ({ destination, budget, numberOfPeople, duration, tripType }) => {
  const system = 'You are a travel planner. You always respond with valid JSON only — no markdown, no code fences, no explanation. Just the raw JSON object.';

  const user = `Generate a ${duration}-day ${tripType} travel itinerary.
Destination: ${destination || 'suggest the best destination for this trip type'}
Total budget: $${budget} for ${numberOfPeople} people
Duration: ${duration} days

Respond with ONLY this JSON structure (no other text):
{
  "destination": "City, Country",
  "totalBudget": "$${budget}",
  "dailyPlan": [
    {
      "day": 1,
      "activities": ["Morning: description (~$XX)", "Afternoon: description (~$XX)", "Evening: description (~$XX)"],
      "estimatedCost": "$XX"
    }
  ],
  "hotelSuggestions": ["Hotel name - $XX/night - short note", "Hotel name - $XX/night - short note"],
  "foodSuggestions": ["Restaurant/dish - $XX - short note", "Restaurant/dish - $XX - short note"]
}

Requirements:
- dailyPlan must have exactly ${duration} day objects
- Total costs must stay within $${budget}
- Return ONLY the JSON, nothing else`;

  const raw = await callGroq(system, user);
  return extractJSON(raw);
};

// Return 3 budget-saving tips as a JSON array of strings
const getBudgetSuggestions = async ({ destination, category, currentSpend, budget }) => {
  const system = 'You are a travel budget advisor. Respond with a JSON array of strings only. No markdown, no explanation.';
  const user   = `Traveler in ${destination} spent $${currentSpend} of $${budget} budget, mostly on ${category}. Give 3 short practical money-saving tips. Return ONLY: ["tip1","tip2","tip3"]`;

  const raw    = await callGroq(system, user);
  const result = extractJSON(raw);
  return Array.isArray(result) ? result : Object.values(result);
};

// AI travel chat assistant
const chatAssistant = async ({ message, tripContext }) => {
  const system = tripContext
    ? `You are a helpful AI travel assistant. The user is planning a trip to ${tripContext.destination} with a $${tripContext.budget} budget for ${tripContext.numberOfPeople} people. Be concise and practical.`
    : 'You are a helpful AI travel assistant. Be concise and practical.';

  return await callGroq(system, message);
};

module.exports = { generateItinerary, getBudgetSuggestions, chatAssistant };
