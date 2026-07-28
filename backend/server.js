const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Force Node.js to prioritize IPv4 over IPv6 when resolving hostnames.
// This is critical on Windows and certain network configurations where Node's native fetch
// fails to connect to Google APIs due to broken IPv6 resolution (TypeError: fetch failed).
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Disable strict SSL verification in Node.js for local development.
// This prevents connection failures (fetch failed) caused by local antivirus programs,
// firewalls, or corporate proxy servers that intercept SSL certificates on Windows.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (nested one directory up from backend/)
app.use(express.static(path.join(__dirname, '../frontend')));

// Helper to clean network errors and guide users on how to resolve network issues
function getCleanErrorMessage(error) {
  const msg = error.message || String(error);
  console.error("Gemini API Error Detail:", error);
  if (msg.includes('fetch failed') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
    return 'Connection to Gemini API failed. This is typically a local network issue, DNS resolution problem, or a firewall/VPN blocking Google APIs. Try turning off any VPN, verifying your internet connection, or restarting the server.';
  }
  return `Gemini API Error: ${msg}`;
}

// Initialize Gemini API
const rawApiKey = process.env.GEMINI_API_KEY;
const apiKey = rawApiKey ? rawApiKey.trim().replace(/^["']|["']$/g, '') : null;
let genAI = null;

if (apiKey && apiKey !== 'replace_with_your_gemini_api_key') {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('WARNING: GEMINI_API_KEY environment variable is not configured properly in .env.');
}

/**
 * 1. POST /api/generate-futureme
 * Generates initial future self profile and reflection data.
 */
app.post('/api/generate-futureme', async (req, res) => {
  try {
    const { name, age, goal, struggle, oneYearVision, tone } = req.body;

    // Validate inputs
    if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
      return res.status(400).json({
        success: false,
        error: 'Please fill out all identity parameters.'
      });
    }

    if (!genAI) {
      return res.status(503).json({
        success: false,
        error: 'FutureMe AI engine is not configured. Please add GEMINI_API_KEY in .env.'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Tone description injection to guide Gemini's creative writing
    let toneInstruction = '';
    if (tone === 'Motivational') {
      toneInstruction = 'warm, inspiring, supportive, deeply belief-affirming, and encouraging the current self to keep going.';
    } else if (tone === 'Brutally Honest') {
      toneInstruction = 'direct, sharp, no excuses, high accountability, telling the current self exactly where they are failing, slacking, or wasting energy.';
    } else if (tone === 'Calm Mentor') {
      toneInstruction = 'peaceful, wise, grounded, patient, looking at struggles as natural stepping stones rather than crises.';
    } else if (tone === 'CEO Mode') {
      toneInstruction = 'strategic, hyper-focused, execution-heavy, treating the current struggle as a system bottleneck that needs to be cleared with high velocity and operational precision.';
    } else {
      toneInstruction = 'clear, balanced, and constructive.';
    }

    const systemPrompt = `You are FutureMe, the future successful version of the user who has fully conquered their current problems. You are not a generic motivational coach. You speak with high emotional intelligence, clarity, and deep personal understanding. Your job is to help the user see who they are becoming, what they must change, and what they should do next.

Write as if you are the user’s future self speaking directly to their current self.

Tone selected by user: ${tone} (${toneInstruction})

User details:
Name: ${name}
Age: ${age}
Goal: ${goal}
Current struggle: ${struggle}
One-year vision: ${oneYearVision}

Return ONLY a valid JSON object in this exact schema, with NO markdown markup outside of it, no backticks, and no extra text:
{
  "message": "A powerful, personalized, and deep 120-180 word message from the future self addressing the user directly as their future self.",
  "futureIdentity": "A concise, single-sentence description of the hyper-aligned, successful version of the user they are becoming.",
  "nextMoves": [
    "Action 1: A highly specific, practical action to take inside the next 48 hours to clear the current struggle.",
    "Action 2: A strategic move to make towards the one-year vision.",
    "Action 3: A standard rule to enforce on their attention or resources."
  ],
  "habit": "One small, concrete daily habit they should start today.",
  "warning": "One mistake or psychological trap their future self warns them to avoid immediately.",
  "mantra": "A short, memorable, powerful line they can repeat daily."
}

Make it extremely specific. Avoid generic motivation and generic clichés. Make it highly personal, emotional, but incredibly practical. Make sure nextMoves, habit, and warning directly tackle the specific struggle of "${struggle}" and build toward "${oneYearVision}".`;

    // Request content generation from Gemini
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = result.response.text();
    let parsedData;

    try {
      // Safely clean markdown formatting if Gemini wrapped it anyway
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```json/i, '').replace(/```$/i, '').trim();
      }
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Error parsing JSON response from Gemini:', responseText);
      return res.status(500).json({
        success: false,
        error: `Invalid Gemini Response formatting: ${responseText.substring(0, 100)}...`
      });
    }

    res.json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: getCleanErrorMessage(error)
    });
  }
});

/**
 * 2. POST /api/chat-futureme
 * Handles real-time conversations with FutureMe, leveraging profile context and history.
 */
app.post('/api/chat-futureme', async (req, res) => {
  try {
    const { userProfile, chatHistory, question } = req.body;

    if (!userProfile || !question) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters (userProfile and question).'
      });
    }

    if (!genAI) {
      return res.status(503).json({
        success: false,
        error: 'FutureMe AI engine is not configured. Please add GEMINI_API_KEY in .env.'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let toneInstruction = '';
    const tone = userProfile.tone;
    if (tone === 'Motivational') {
      toneInstruction = 'warm, inspiring, supportive, encouraging, and highly belief-affirming.';
    } else if (tone === 'Brutally Honest') {
      toneInstruction = 'direct, sharp, no excuses, high accountability, calling out slacking or procrastination directly and honestly.';
    } else if (tone === 'Calm Mentor') {
      toneInstruction = 'peaceful, wise, grounded, patient, framing difficulties as vital learning paths.';
    } else if (tone === 'CEO Mode') {
      toneInstruction = 'strategic, focused, execution-heavy, and result-oriented, treating every issue as a bottleneck to be resolved.';
    } else {
      toneInstruction = 'balanced and personal.';
    }

    // Format chat history for context
    const historyText = chatHistory && chatHistory.length > 0
      ? chatHistory.map(h => `${h.role === 'user' ? 'Current Self' : 'FutureMe'}: ${h.message}`).join('\n')
      : 'No previous messages.';

    const chatPrompt = `You are FutureMe, the future version of the user who already achieved their one-year vision of "${userProfile.oneYearVision}" at the age of ${parseInt(userProfile.age) + 1}. Reply directly to the user’s question. Be personal, sharp, honest, and useful. Do not sound like a normal AI assistant. Do not mention that you are an AI model, Gemini, or a large language model. Speak exactly like the user's future self.

User profile:
Name: ${userProfile.name}
Age: ${userProfile.age}
Goal: ${userProfile.goal}
Struggle: ${userProfile.struggle}
One-year vision: ${userProfile.oneYearVision}
Tone: ${userProfile.tone} (${toneInstruction})

Recent chat history:
${historyText}

Current question from my Current Self:
${question}

Instructions:
Reply in 2-5 short, punchy paragraphs. Speak directly to me, addressing me by my name if appropriate. Give at least one clear, actionable next step I can take today. Avoid corporate AI clichés, introductory filler, and robotic structure.`;

    const result = await model.generateContent(chatPrompt);
    const replyText = result.response.text().trim();

    res.json({
      success: true,
      reply: replyText
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: getCleanErrorMessage(error)
    });
  }
});

// Fallback to serving the HTML index for single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`FutureMe server is running successfully!`);
    console.log(`Local Access URL: http://localhost:${PORT}`);
    console.log(`===================================================`);
  });
}

module.exports = app;

