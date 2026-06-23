'use strict';
// services/aiService.js
// ────────────────────────────────────────────────────────────────────────────
// AI provider abstraction. Supports OpenAI (default) and Google Gemini.
// Uses Node 18+ native fetch — no extra npm packages required.
//
// Required env vars:
//   AI_API_KEY   — your provider API key
// Optional env vars:
//   AI_PROVIDER  — 'openai' (default) | 'gemini'
//   AI_MODEL     — model name (defaults per provider below)

const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const AI_API_KEY  =  process.env.AI_API_KEY;
const AI_MODEL    =  process.env.AI_MODEL
  || (AI_PROVIDER === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini');

// ── OpenAI-compatible Chat Completions (OpenAI and Groq share this format) ──
async function callOpenAICompat(systemPrompt, userMessage, baseURL) {
  const response = await fetch(`${baseURL}/chat/completions`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model:           AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  },
      ],
      temperature:     0.7,
      max_tokens:      1500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data    = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from AI');

  try {
    return JSON.parse(content);
  } catch {
    throw new Error('AI returned invalid JSON. Try again.');
  }
}

// ── Extract JSON from a string that may be wrapped in markdown code fences ──
function extractJSON(text) {
  // Strip ```json ... ``` or ``` ... ``` wrappers Gemini sometimes adds
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw    = fenced ? fenced[1].trim() : text.trim();
  return JSON.parse(raw);
}

// ── Google Gemini generateContent ────────────────────────────────────────────
async function callGemini(systemPrompt, userMessage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`;

  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\n\n${userMessage}` }],
      }],
      generationConfig: {
        temperature:     0.7,
        maxOutputTokens: 1500,
        // responseMimeType omitted — not supported on all models/endpoints.
        // JSON output is enforced via the system prompt instead.
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error ${response.status}`);
  }

  const data    = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error('Empty response from Gemini');

  try {
    return extractJSON(content);
  } catch {
    throw new Error('Gemini returned invalid JSON. Try again.');
  }
}

// ── Public entry point ───────────────────────────────────────────────────────
async function askAI(systemPrompt, userMessage) {
  if (!AI_API_KEY) {
    throw new Error(
      'AI_API_KEY is not configured. ' +
      'Add AI_API_KEY=<your-key> to the backend .env file and restart the server.'
    );
  }

  if (AI_PROVIDER === 'gemini') return callGemini(systemPrompt, userMessage);
  if (AI_PROVIDER === 'groq')   return callOpenAICompat(systemPrompt, userMessage, 'https://api.groq.com/openai/v1');
  /* openai (default) */        return callOpenAICompat(systemPrompt, userMessage, 'https://api.openai.com/v1');
}

module.exports = { askAI, AI_PROVIDER, AI_MODEL };
