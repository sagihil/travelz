'use strict';
const { Op }  = require('sequelize');
const {
  Trip, Attraction, TripAttraction, UserInterest, Interest,
} = require('../../models/associations');
const { askAI } = require('../services/aiService');

// ── Region → country mapping ─────────────────────────────────────────────────
const REGION_TO_COUNTRIES = {
  'middle east':    ['israel', 'jordan', 'egypt', 'turkey', 'uae', 'united arab emirates',
                     'saudi arabia', 'qatar', 'bahrain', 'kuwait', 'oman', 'lebanon',
                     'syria', 'iraq', 'iran', 'palestine', 'yemen'],
  'europe':         ['france', 'germany', 'italy', 'spain', 'united kingdom', 'england',
                     'scotland', 'wales', 'ireland', 'greece', 'portugal', 'netherlands',
                     'belgium', 'switzerland', 'austria', 'poland', 'czech republic',
                     'hungary', 'croatia', 'sweden', 'norway', 'denmark', 'finland'],
  'east asia':      ['japan', 'china', 'south korea', 'taiwan', 'hong kong', 'mongolia'],
  'southeast asia': ['thailand', 'vietnam', 'cambodia', 'indonesia', 'malaysia',
                     'singapore', 'philippines', 'myanmar', 'laos'],
  'south asia':     ['india', 'nepal', 'sri lanka', 'pakistan', 'bangladesh'],
  'north america':  ['usa', 'united states', 'canada', 'mexico'],
  'latin america':  ['brazil', 'argentina', 'chile', 'peru', 'colombia', 'ecuador',
                     'bolivia', 'uruguay', 'venezuela', 'cuba', 'costa rica', 'panama'],
  'africa':         ['egypt', 'morocco', 'south africa', 'kenya', 'tanzania', 'ethiopia',
                     'ghana', 'nigeria', 'senegal', 'tunisia', 'algeria', 'zimbabwe'],
  'north africa':   ['egypt', 'morocco', 'tunisia', 'algeria', 'libya'],
  'oceania':        ['australia', 'new zealand', 'fiji'],
  'scandinavia':    ['sweden', 'norway', 'denmark', 'finland', 'iceland'],
  'balkans':        ['croatia', 'serbia', 'greece', 'bulgaria', 'albania', 'slovenia',
                     'bosnia', 'montenegro', 'north macedonia'],
  'caribbean':      ['cuba', 'jamaica', 'bahamas', 'haiti', 'dominican republic', 'barbados'],
  'central asia':   ['kazakhstan', 'uzbekistan', 'kyrgyzstan', 'tajikistan', 'turkmenistan'],
};

const COUNTRY_ALIASES = {
  'uk':      'united kingdom',
  'usa':     'united states',
  'us':      'united states',
  'america': 'united states',
  'uae':     'united arab emirates',
};

// ── helpers ───────────────────────────────────────────────────────────────────

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Expand a region keyword (e.g. "middle east") → add all its countries to the set.
// If text contains a specific country name → add only that country (no expansion).
function expandIntoSet(text, target) {
  for (const [region, countries] of Object.entries(REGION_TO_COUNTRIES)) {
    if (text.includes(region)) countries.forEach(c => target.add(c));
  }
}

// Find country/city names from the DB that literally appear in `text`.
function matchDbLocations(text, allAttractions, countries, cities) {
  const dbCountries = [...new Set(
    allAttractions.map(a => (a.country || '').toLowerCase().trim()).filter(c => c.length > 2)
  )];
  for (const c of dbCountries) {
    if (new RegExp(`\\b${escapeRegex(c)}\\b`).test(text)) countries.add(c);
  }

  const dbCities = [...new Set(
    allAttractions.map(a => (a.city || '').toLowerCase().trim()).filter(c => c.length > 2)
  )];
  for (const city of dbCities) {
    if (new RegExp(`\\b${escapeRegex(city)}\\b`).test(text)) cities.add(city);
  }
}

// ── A. Base destinations (title + description + existing attractions) ─────────
// Existing attraction countries trigger REGIONAL EXPANSION so that a trip with
// attractions in Jordan automatically includes all Middle East candidates.
function getBaseDestinations(trip, allAttractions, tripAttractions) {
  let tripText = [trip.title, trip.description].filter(Boolean).join(' ').toLowerCase();
  for (const [alias, full] of Object.entries(COUNTRY_ALIASES)) {
    tripText = tripText.replace(new RegExp(`\\b${escapeRegex(alias)}\\b`, 'g'), full);
  }

  const countries = new Set();
  const cities    = new Set();

  expandIntoSet(tripText, countries);
  matchDbLocations(tripText, allAttractions, countries, cities);

  // Convert city hits → country
  for (const city of cities) {
    allAttractions
      .filter(a => (a.city || '').toLowerCase().trim() === city && a.country)
      .forEach(a => countries.add(a.country.toLowerCase().trim()));
  }

  // Existing trip attractions → country + REGIONAL EXPANSION
  const existingCountries = [...new Set(
    tripAttractions.map(a => (a.country || '').toLowerCase().trim()).filter(Boolean)
  )];
  for (const country of existingCountries) {
    countries.add(country);
    for (const regionCountries of Object.values(REGION_TO_COUNTRIES)) {
      if (regionCountries.some(rc => rc === country || rc.includes(country) || country.includes(rc))) {
        regionCountries.forEach(c => countries.add(c));
        break;
      }
    }
  }

  return countries;
}

// ── B. Message destinations (current user request) ────────────────────────────
// "also germany"  → adds Germany ONLY (no European expansion).
// "also europe"   → expands to all European countries (region keyword).
// Purely ADDITIVE — never replaces base destinations.
function extractMessageDestinations(message, allAttractions) {
  let msgText = message.toLowerCase();
  for (const [alias, full] of Object.entries(COUNTRY_ALIASES)) {
    msgText = msgText.replace(new RegExp(`\\b${escapeRegex(alias)}\\b`, 'g'), full);
  }

  const countries = new Set();
  const cities    = new Set();

  // Region keywords → expand
  expandIntoSet(msgText, countries);
  // Specific country/city names → add directly (no expansion for individual countries)
  matchDbLocations(msgText, allAttractions, countries, cities);

  for (const city of cities) {
    allAttractions
      .filter(a => (a.city || '').toLowerCase().trim() === city && a.country)
      .forEach(a => countries.add(a.country.toLowerCase().trim()));
  }

  return countries;
}

// ── C. Filter attractions by the combined country set ─────────────────────────
function filterAttractionsByCountries(allAttractions, allowedCountries) {
  return allAttractions.filter(a => {
    const country = (a.country || '').toLowerCase().trim();
    for (const allowed of allowedCountries) {
      if (country === allowed || country.includes(allowed) || allowed.includes(country)) return true;
    }
    return false;
  });
}

// ── D. Debug logger ────────────────────────────────────────────────────────────
function logAIContext(tripId, baseCountries, msgCountries, allCountries, candidates, applied) {
  console.log(`\n╔══ AI Travel Agent ── Trip #${tripId} ══╗`);
  console.log(`  Base destinations (title/attractions): ${[...baseCountries].join(', ') || 'none'}`);
  console.log(`  Message destinations (user request):   ${[...msgCountries].join(', ') || 'none'}`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Allowed countries (combined):          ${[...allCountries].join(', ') || 'none'}`);
  console.log(`  Candidate attractions:                  ${candidates.length} found`);
  candidates.slice(0, 8).forEach(a =>
    console.log(`    • [ID:${a.id}] ${a.name} — ${a.city}, ${a.country}`)
  );
  if (candidates.length > 8) console.log(`    … and ${candidates.length - 8} more`);
  if (applied.length > 0) {
    console.log(`  Applied actions:`);
    applied.forEach(a => console.log(`    ✓ ${a.type} attractionId=${a.attractionId}`));
  }
  console.log(`╚${'═'.repeat(44)}╝\n`);
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `\
You are TravelZ AI Travel Agent — a friendly, knowledgeable travel assistant embedded in a trip-planning app.
You have two modes: ACTION mode (modify the trip) and ADVISORY mode (answer questions, give recommendations).

YOU MUST ALWAYS respond with valid JSON in EXACTLY this structure:
{
  "message": "<your reply in plain text>",
  "actions": [],
  "recommendations": []
}

=== ACTION TYPES (use in "actions" array) ===
Add attraction not in trip:
  { "type": "ADD_ATTRACTION_TO_TRIP", "attractionId": <int>, "dayNumber": <int>, "orderInDay": <int> }
Remove attraction from trip:
  { "type": "REMOVE_ATTRACTION_FROM_TRIP", "attractionId": <int> }
Move / reorder attraction:
  { "type": "UPDATE_TRIP_ATTRACTION", "attractionId": <int>, "dayNumber": <int>, "orderInDay": <int> }

=== RECOMMENDATIONS (use in "recommendations" array) ===
Include when discussing or suggesting specific attractions — even if not adding them to the trip.
Each entry:
{
  "attractionId": <int — must be from CANDIDATE ATTRACTIONS list>,
  "name": "<attraction name>",
  "country": "<country>",
  "category": "<category>",
  "relevanceScores": {
    "<UserInterest>": <0-100>
  },
  "reason": "<1-2 sentence explanation of why this matches the user>"
}
relevanceScores keys must exactly match the user's listed interests.
Score 0 = no match, 100 = perfect match. Only include interests that are relevant.

=== ADVISORY MODE ===
When the user asks a question ("what do you recommend?", "which is best?", "why?", etc.):
- Answer naturally and helpfully in the "message" field.
- Return "actions": [].
- Include "recommendations" for any attractions you discuss.
- Use the user's interests and the candidate list to personalise your answer.
- Do NOT force a DB modification if none was asked for.

=== GEOGRAPHIC CONSTRAINT — CRITICAL ===
The CANDIDATE ATTRACTIONS list has been pre-filtered for this trip's destinations.
You MUST ONLY use IDs from this list for ADD actions and recommendations.
Never recommend attractions from other countries. Never invent IDs.

=== DESTINATION UPDATES ===
"Also X" / "add X" = ADD X as a new destination — do NOT replace existing destinations.
Always keep all previously detected destinations unless user explicitly says "replace" or "change destination completely".

=== FORMAT RULES ===
- Start "message" by naming which destinations you are covering.
  Example: "I'm planning for Israel, Jordan, and Germany."
- For REMOVE / UPDATE: only use IDs from CURRENT TRIP ATTRACTIONS.
- dayNumber: positive integer within trip duration. orderInDay starts at 1 per day.
- Spread attractions evenly across days — never pile everything on day 1.
- If the candidate list is too small, say so and explain.
- If no changes needed, return "actions": [].`;

// ── Context block ─────────────────────────────────────────────────────────────
function buildContextBlock({ user, interests, trip, tripAttractions, candidates, allCountries }) {
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;

  const tripDays = trip.startDate && trip.endDate
    ? Math.max(1, Math.ceil(
        (new Date(trip.endDate) - new Date(trip.startDate)) / 86_400_000
      ) + 1)
    : null;

  const interestList = interests.length > 0
    ? interests.map(i => i.name).join(', ')
    : 'None specified';

  const sortedCurrent = [...tripAttractions].sort((a, b) => {
    const da = a.TripAttraction?.dayNumber ?? 999;
    const db = b.TripAttraction?.dayNumber ?? 999;
    if (da !== db) return da - db;
    return (a.TripAttraction?.orderInDay ?? 0) - (b.TripAttraction?.orderInDay ?? 0);
  });

  const currentLines = sortedCurrent.length === 0
    ? '  (none yet)'
    : sortedCurrent.map(a => {
        const ta = a.TripAttraction;
        return `  - Day ${ta?.dayNumber ?? '?'}, Order ${ta?.orderInDay ?? '?'}: [ID:${a.id}] ${a.name} — ${a.city}, ${a.country} | ${a.category} | ⭐${a.rating ?? 'N/A'}`;
      }).join('\n');

  const destinationList = [...allCountries]
    .map(c => c.charAt(0).toUpperCase() + c.slice(1))
    .join(', ') || 'Unknown';

  const candidateLines = candidates.length === 0
    ? '  (no candidates for the detected destinations)'
    : candidates.slice(0, 40).map(a =>
        `  - [ID:${a.id}] ${a.name} — ${a.city}, ${a.country} | ${a.category} | ⭐${a.rating ?? 'N/A'}`
      ).join('\n')
      + (candidates.length > 40 ? `\n  (+ ${candidates.length - 40} more)` : '');

  const dateRange = trip.startDate && trip.endDate
    ? `Dates: ${trip.startDate} → ${trip.endDate}  (${tripDays} day${tripDays !== 1 ? 's' : ''})\n`
    : '';

  return `=== USER ===
Name: ${displayName}
Interests: ${interestList}

=== TRIP ===
Title: "${trip.title}" (ID: ${trip.id})
${trip.description ? `Description: ${trip.description}\n` : ''}\
${dateRange}
=== TRIP DESTINATIONS (allowed countries — derived from title, existing attractions, and user request) ===
${destinationList}

=== CURRENT TRIP ATTRACTIONS ===
${currentLines}

=== CANDIDATE ATTRACTIONS (ADD only from this list — destination-filtered) ===
${candidateLines}`;
}

// ── Validate + apply one action ────────────────────────────────────────────────
async function applyAction(action, tripId, inTripSet, allAttrSet, relevantAttrIds) {
  const { type } = action;
  const attrId   = Number(action.attractionId);
  const day      = action.dayNumber  != null ? Number(action.dayNumber)  : null;
  const order    = action.orderInDay != null ? Number(action.orderInDay) : null;

  if (!Number.isInteger(attrId) || attrId <= 0)
    return { ok: false, reason: `Invalid attractionId: "${action.attractionId}"` };
  if (day !== null && (!Number.isInteger(day) || day < 1))
    return { ok: false, reason: `Invalid dayNumber: "${action.dayNumber}"` };

  switch (type) {
    case 'ADD_ATTRACTION_TO_TRIP':
      if (!allAttrSet.has(attrId))
        return { ok: false, reason: `Attraction ${attrId} does not exist in the database.` };
      if (!relevantAttrIds.has(attrId))
        return { ok: false, reason: `Attraction ${attrId} is not in the allowed destinations for this trip.` };
      if (inTripSet.has(attrId))
        return { ok: false, reason: `Attraction ${attrId} is already in this trip.` };
      await TripAttraction.create({ tripId, attractionId: attrId, dayNumber: day, orderInDay: order, notes: null });
      return { ok: true };

    case 'REMOVE_ATTRACTION_FROM_TRIP':
      if (!inTripSet.has(attrId))
        return { ok: false, reason: `Attraction ${attrId} is not in this trip.` };
      await TripAttraction.destroy({ where: { tripId, attractionId: attrId } });
      return { ok: true };

    case 'UPDATE_TRIP_ATTRACTION':
      if (!inTripSet.has(attrId))
        return { ok: false, reason: `Attraction ${attrId} is not in this trip.` };
      await TripAttraction.update(
        { dayNumber: day, orderInDay: order },
        { where: { tripId, attractionId: attrId } }
      );
      return { ok: true };

    default:
      return { ok: false, reason: `Unknown action type: "${type}"` };
  }
}

// ── POST /api/ai/travel-agent ─────────────────────────────────────────────────
exports.travelAgent = async (req, res) => {
  try {
    const { tripId, message } = req.body;
    const userId = req.user.userId;

    if (!tripId || !String(message ?? '').trim()) {
      return res.status(400).json({ success: false, data: null,
        error: { code: 'VALIDATION_ERROR', message: 'tripId and message are required.' },
      });
    }

    // ── 1. Load trip + ownership check ─────────────────────────────────
    const trip = await Trip.findByPk(Number(tripId));
    if (!trip) {
      return res.status(404).json({ success: false, data: null,
        error: { code: 'NOT_FOUND', message: 'Trip not found.' },
      });
    }
    if (Number(trip.userId) !== Number(userId)) {
      return res.status(403).json({ success: false, data: null,
        error: { code: 'FORBIDDEN', message: 'You can only use the AI agent on your own trips.' },
      });
    }

    // ── 2. Load user interests ──────────────────────────────────────────
    const uiRows = await UserInterest.findAll({
      where: { userId }, attributes: ['interestId'], raw: true,
    });
    const interests = uiRows.length > 0
      ? await Interest.findAll({ where: { id: { [Op.in]: uiRows.map(r => r.interestId) } } })
      : [];

    // ── 3. Load current trip attractions ───────────────────────────────
    const tripFull = await Trip.findByPk(Number(tripId), {
      include: [{ model: Attraction, through: { attributes: ['dayNumber', 'orderInDay', 'notes'] } }],
    });
    const tripAttractions = tripFull?.Attractions ?? [];
    const inTripSet       = new Set(tripAttractions.map(a => a.id));

    // ── 4. Load all DB attractions ──────────────────────────────────────
    const allAttractions = await Attraction.findAll({ order: [['rating', 'DESC']] });
    const allAttrSet     = new Set(allAttractions.map(a => a.id));

    // ── 5. Determine destinations ───────────────────────────────────────
    // A: from trip title/description + existing attraction countries
    const baseCountries = getBaseDestinations(trip, allAttractions, tripAttractions);

    // B: from the current user message (additive — never replaces base)
    const msgCountries  = extractMessageDestinations(message, allAttractions);

    // C: union — incremental, always keeps existing destinations
    const allCountries  = new Set([...baseCountries, ...msgCountries]);

    // ── 6. No destination detected → ask for clarification ──────────────
    if (allCountries.size === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: `I couldn't determine the destination of this trip from its title "${trip.title}", description, or existing attractions. Could you update the trip title or description with a location? Examples: "Israel & Jordan Adventure", "Middle East Tour", "Paris Getaway".`,
          applied: [],
          skipped: [],
        },
        error: null,
      });
    }

    // ── 7. Filter attractions to allowed destinations ───────────────────
    const relevantAttractions = filterAttractionsByCountries(allAttractions, allCountries);
    const relevantAttrIds     = new Set(relevantAttractions.map(a => a.id));
    const candidates          = relevantAttractions.filter(a => !inTripSet.has(a.id));

    // Debug log
    logAIContext(Number(tripId), baseCountries, msgCountries, allCountries, candidates, []);

    if (relevantAttractions.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: `I detected this trip covers: ${[...allCountries].join(', ')}. However, there are no attractions in the database for these destinations yet. Add some attractions for this region first via the Attractions Management section on the Dashboard.`,
          applied: [],
          skipped: [],
        },
        error: null,
      });
    }

    // ── 8. Build prompt + call AI ───────────────────────────────────────
    const contextBlock = buildContextBlock({
      user: req.user, interests, trip, tripAttractions, candidates, allCountries,
    });
    const userTurn = `${contextBlock}\n\n=== USER REQUEST ===\n${message.trim()}`;

    let aiResult;
    try {
      aiResult = await askAI(SYSTEM_PROMPT, userTurn);
    } catch (aiErr) {
      return res.status(502).json({ success: false, data: null,
        error: { code: 'AI_ERROR', message: aiErr.message },
      });
    }

    if (!aiResult || typeof aiResult !== 'object') {
      return res.status(502).json({ success: false, data: null,
        error: { code: 'AI_ERROR', message: 'AI returned an unexpected response format.' },
      });
    }

    const responseMessage   = typeof aiResult.message         === 'string' ? aiResult.message : 'Done!';
    const actions           = Array.isArray(aiResult.actions)         ? aiResult.actions         : [];
    const recommendations   = Array.isArray(aiResult.recommendations) ? aiResult.recommendations : [];

    // ── 9. Validate + apply each action ────────────────────────────────
    const applied = [];
    const skipped = [];

    for (const action of actions) {
      const result = await applyAction(action, Number(tripId), inTripSet, allAttrSet, relevantAttrIds);
      if (result.ok) {
        if (action.type === 'ADD_ATTRACTION_TO_TRIP')      inTripSet.add(Number(action.attractionId));
        if (action.type === 'REMOVE_ATTRACTION_FROM_TRIP') inTripSet.delete(Number(action.attractionId));
        applied.push(action);
      } else {
        skipped.push({ action, reason: result.reason });
      }
    }

    // Log applied actions
    if (applied.length > 0) logAIContext(Number(tripId), baseCountries, msgCountries, allCountries, candidates, applied);

    return res.status(200).json({
      success: true,
      data:    { message: responseMessage, applied, skipped, recommendations },
      error:   null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
};
