const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Use the API key provided by user
const API_KEY = 'AIzaSyB335TRffIl7LxgxJrqHxq3r1UlwmOAAvQ';

console.log('🔑 Testing API Key:', API_KEY.substring(0, 10) + '...');
console.log('\n🔍 Testing different Gemini models...\n');

async function testModels() {
  const genAI = new GoogleGenerativeAI(API_KEY);

  // List of models to test from newest to oldest
  const modelsToTest = [
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash-thinking-exp',
    'gemini-exp-1206',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-pro',
    'models/gemini-2.0-flash-exp',
    'models/gemini-1.5-pro-latest',
    'models/gemini-1.5-flash-latest',
  ];

  const workingModels = [];

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent('Reply with just "OK"');
      const response = await result.response;
      const text = response.text();
      
      if (text) {
        console.log(`✅ ${modelName} - WORKING!`);
        workingModels.push(modelName);
      }
    } catch (error) {
      const errorMsg = error.message.substring(0, 100);
      console.log(`❌ ${modelName} - ${errorMsg}...`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS:');
  console.log('='.repeat(60));
  
  if (workingModels.length > 0) {
    console.log(`\n✅ Found ${workingModels.length} working model(s):\n`);
    workingModels.forEach((model, i) => {
      console.log(`${i + 1}. ${model} ${i === 0 ? '⭐ (RECOMMENDED)' : ''}`);
    });
    
    console.log('\n💡 UPDATE YOUR CODE TO USE: ' + workingModels[0]);
  } else {
    console.log('\n❌ NO WORKING MODELS FOUND');
    console.log('\n🔧 SOLUTIONS:');
    console.log('1. Get a NEW API key from: https://aistudio.google.com/app/apikey');
    console.log('2. Make sure you accept Google AI Studio terms');
    console.log('3. Enable the Gemini API in your Google Cloud Console');
  }
}

testModels().catch(console.error);
