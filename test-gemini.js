const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

async function testGemini() {
  console.log('\n🔍 Testing Google Gemini API...\n');
  
  const genAI = new GoogleGenerativeAI(API_KEY);

  // Test available models
  const modelsToTest = [
    'gemini-2.0-flash-exp',      // Latest Gemini 2.0
    'gemini-2.0-flash',
    'gemini-exp-1206',           // Experimental
    'gemini-1.5-pro',            // Gemini 1.5 Pro
    'gemini-1.5-flash',          // Gemini 1.5 Flash
    'gemini-pro'                 // Original Gemini Pro
  ];

  const workingModels = [];

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent('Reply with just "OK"');
      const response = await result.response;
      const text = response.text();
      
      if (text) {
        console.log(`✅ ${modelName} - WORKING`);
        workingModels.push(modelName);
      }
    } catch (error) {
      console.log(`❌ ${modelName} - Not available: ${error.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`Working models: ${workingModels.length}`);
  
  if (workingModels.length > 0) {
    console.log('\n✅ Available models:');
    workingModels.forEach((model, i) => {
      console.log(`${i + 1}. ${model}`);
    });
    
    // Test menu parsing with the best model
    console.log(`\n🧪 Testing menu parsing with: ${workingModels[0]}...\n`);
    await testMenuParsing(genAI, workingModels[0]);
  } else {
    console.log('❌ No models available. Please check your API key.');
  }
}

async function testMenuParsing(genAI, modelName) {
  const sampleMenu = `
    STARTERS
    Chicken Wings - $12.99
    Crispy wings with BBQ sauce
    
    Caesar Salad - $8.50
    Fresh romaine lettuce, parmesan, croutons
    
    MAIN COURSE
    Margherita Pizza - $15.99
    Fresh mozzarella, basil, tomato sauce
    
    Grilled Salmon - $22.00
    With vegetables and lemon butter
  `;

  const prompt = `Extract menu items from the following text. Return ONLY a valid JSON array with this structure:
[{"name": "item name", "description": "description", "price": 0.00, "category": "category"}]

Rules:
- Price must be a number without currency symbols
- Category: appetizers, mains, desserts, beverages, or sides
- Return ONLY the JSON array

Menu:
${sampleMenu}`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
      }
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw response:');
    console.log(text);
    console.log('\n');
    
    // Try to parse JSON
    const jsonMatch = text.match(/\[([\s\S]*?)\]/);
    if (jsonMatch) {
      const items = JSON.parse('[' + jsonMatch[1] + ']');
      console.log('✅ Parsed items:');
      console.log(JSON.stringify(items, null, 2));
      console.log(`\n📊 Extracted ${items.length} items successfully!`);
    } else {
      console.log('⚠️ Could not extract JSON from response');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testGemini().catch(console.error);
