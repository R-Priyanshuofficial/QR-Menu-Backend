const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generate AI-powered QR placeholder design variations
 * @param {object} params - Design parameters
 * @returns {Promise<Array>} Array of design specifications
 */
const generateDesignVariations = async (params) => {
  const {
    restaurantName,
    template,
    qrType,
    tableNumber
  } = params;

  // Validate API key exists
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('⚠️ Gemini API key not configured. Using default designs.');
    return getDefaultDesigns(template);
  }

  console.log('🤖 Attempting to use Gemini AI for design generation...');

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use timeout for API call to prevent long waits
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout')), 10000);
    });

    const generatePromise = (async () => {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const prompt = `You are a professional graphic designer. Generate 3 creative design variations for a QR code placeholder.

Restaurant: "${restaurantName}"
Style Template: ${template.name} (${template.description})
QR Type: ${qrType === 'table' ? `Table ${tableNumber}` : 'Global Menu'}

For each variation, provide:
1. Restaurant name typography (font size, weight, letter spacing)
2. Layout style (centered, offset, decorative elements)
3. Color accents and decorative patterns
4. Branding placement style

Return ONLY a JSON array with 3 design objects. Each object should have:
{
  "id": "design-1",
  "name": "Design Name",
  "description": "Brief description",
  "header": {
    "fontSize": number (36-54),
    "fontWeight": "normal|bold",
    "letterSpacing": number (1-4),
    "textAlign": "center|left",
    "decorative": "none|underline|frame"
  },
  "layout": {
    "padding": number (20-40),
    "qrSize": "normal|large",
    "style": "minimal|elegant|modern"
  },
  "branding": {
    "position": "bottom-right|bottom-center",
    "size": "small|medium",
    "style": "subtle|prominent"
  }
}

Make designs professional, print-ready, and aligned with the ${template.name} theme.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('⚠️ No JSON array found in Gemini response. Using default designs.');
        return getDefaultDesigns(template);
      }

      const designs = JSON.parse(jsonMatch[0]);
      
      // Validate and ensure we have 3 designs
      if (!Array.isArray(designs) || designs.length < 3) {
        console.warn('⚠️ Invalid design array from Gemini. Using default designs.');
        return getDefaultDesigns(template);
      }

      console.log('✅ Successfully generated AI designs with Gemini');
      return designs.slice(0, 3);
    })();

    // Race between API call and timeout
    return await Promise.race([generatePromise, timeoutPromise]);

  } catch (error) {
    // Detailed error logging
    console.error('❌ Gemini AI design generation error:');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    
    // Check for specific error types
    if (error.message && error.message.includes('404')) {
      console.error('⚠️ Gemini API model not found. The API key may be incompatible with the requested model.');
      console.error('💡 Suggestion: Get a new API key from https://aistudio.google.com/app/apikey');
    } else if (error.message && error.message.includes('API key')) {
      console.error('⚠️ Invalid API key. Please check your GEMINI_API_KEY in .env file.');
    } else if (error.message && error.message.includes('timeout')) {
      console.error('⚠️ Gemini API request timed out.');
    }
    
    console.log('🔄 Falling back to default designs...');
    // Fallback to default designs
    return getDefaultDesigns(template);
  }
};

/**
 * Get default design variations (fallback)
 * @param {object} template - Template object
 * @returns {Array} Default design specifications
 */
const getDefaultDesigns = (template) => {
  return [
    {
      id: 'design-1',
      name: 'Royal Gold Luxury',
      description: 'Premium Art Deco design with metallic gold gradients',
      header: {
        fontSize: 56,
        fontWeight: 'bold',
        letterSpacing: 4,
        textAlign: 'center',
        decorative: 'artDeco',
        color: '#EAB308',
        gradient: 'gold'
      },
      layout: {
        padding: 45,
        qrSize: 'normal',
        style: 'luxury',
        frameColor: '#0F172A'
      },
      // Override QR colors for cohesive premium look
      qrOverride: {
        qrColor: '#1F2937',      // Dark charcoal QR modules
        backgroundColor: '#FEF3C7', // Warm cream/ivory background
        borderColor: '#0F172A'   // Dark frame
      },
      branding: {
        position: 'bottom-center',
        size: 'medium',
        style: 'gold'
      }
    },
    {
      id: 'design-2',
      name: 'Platinum Elite',
      description: 'Sophisticated modern design with silver metallic accents',
      header: {
        fontSize: 56,
        fontWeight: 'bold',
        letterSpacing: 5,
        textAlign: 'center',
        decorative: 'artDeco',
        color: '#E2E8F0',
        gradient: 'silver'
      },
      layout: {
        padding: 45,
        qrSize: 'normal',
        style: 'luxury',
        frameColor: '#1A202C'
      },
      // Silver theme QR colors
      qrOverride: {
        qrColor: '#1E293B',      // Dark slate QR modules
        backgroundColor: '#F1F5F9', // Light silver/gray background
        borderColor: '#1A202C'   // Dark frame
      },
      branding: {
        position: 'bottom-center',
        size: 'medium',
        style: 'silver'
      }
    },
    {
      id: 'design-3',
      name: 'Rose Gold Elegance',
      description: 'Warm, high-end design with copper/rose gold finish',
      header: {
        fontSize: 56,
        fontWeight: 'bold',
        letterSpacing: 4,
        textAlign: 'center',
        decorative: 'artDeco',
        color: '#FB7185',
        gradient: 'roseGold'
      },
      layout: {
        padding: 45,
        qrSize: 'normal',
        style: 'luxury',
        frameColor: '#2B1810'
      },
      // Rose gold theme QR colors
      qrOverride: {
        qrColor: '#44271B',      // Deep brown QR modules
        backgroundColor: '#FFF1F2', // Soft rose/blush background
        borderColor: '#2B1810'   // Warm brown frame
      },
      branding: {
        position: 'bottom-center',
        size: 'medium',
        style: 'roseGold'
      }
    }
  ];
};

module.exports = {
  generateDesignVariations,
  getDefaultDesigns
};
