const Groq = require('groq-sdk');
require('dotenv').config();

const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
  console.error('❌ GROQ_API_KEY not found in .env file');
  process.exit(1);
}

async function testGroq() {
  console.log('\n🔍 Testing Groq API...\n');
  
  const groq = new Groq({ apiKey: API_KEY });

  // Test available models
  const modelsToTest = [
    'llama-3.3-70b-versatile',    // Latest Llama 3.3
    'llama-3.2-90b-vision-preview', // Llama 3.2 with vision
    'llama-3.1-70b-versatile',    // Llama 3.1
    'llama3-70b-8192',            // Llama 3 70B
    'llama3-8b-8192',             // Llama 3 8B (fastest)
    'mixtral-8x7b-32768',         // Mixtral
    'gemma2-9b-it',               // Gemma 2
  ];

  const workingModels = [];

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model: ${modelName}...`);
      
      const completion = await groq.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: 'Reply with just "OK"' }],
        temperature: 0.1,
        max_tokens: 10
      });
      
      if (completion.choices[0]?.message?.content) {
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
    await testMenuParsing(groq, workingModels);
  } else {
    console.log('❌ No models available. Please check your API key.');
  }
}

async function testMenuParsing(groq, models) {
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

  // Test with different models
  for (const modelName of models) {
    console.log(`\n📝 Testing: ${modelName}`);
    try {
      const completion = await groq.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000
      });
      
      const text = completion.choices[0].message.content;
      
      // Try to parse JSON
      const jsonMatch = text.match(/\[([\s\S]*?)\]/);
      if (jsonMatch) {
        const items = JSON.parse('[' + jsonMatch[1] + ']');
        console.log(`✅ Extracted ${items.length} items`);
        
        // Show first model's detailed output
        if (modelName === models[0]) {
          console.log('\nDetailed output:');
          console.log(JSON.stringify(items, null, 2));
        }
      } else {
        console.log('⚠️ Could not extract JSON from response');
      }
      
      // Check response time
      const tokensPerSecond = completion.usage?.total_tokens || 0;
      console.log(`⚡ Speed: ${tokensPerSecond} tokens`);
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
  }
}

// Run test
testGroq().catch(console.error);
