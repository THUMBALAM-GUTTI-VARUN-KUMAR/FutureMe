const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Using API Key prefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'None');
  
  if (!apiKey) {
    console.error('No GEMINI_API_KEY found in .env');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 1. Direct fetch test (GET)
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log('Direct GET Response status:', response.status);

    // 2. SDK Test (POST)
    console.log('Testing SDK call with gemini-2.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Say hello in one word');
    console.log('SDK Call succeeded! Response:', result.response.text());
  } catch (error) {
    console.error('Error during test:', error);
  }
}

run();

