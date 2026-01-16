const MenuItem = require('../models/MenuItem');
const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
const sharp = require('sharp');
const ApiError = require('../utils/ApiError');

// Initialize AI providers (optional - based on available API keys)
let openai = null;
let gemini = null;
let groq = null;

// OpenAI
if (process.env.OPENAI_API_KEY) {
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Google Gemini (FREE - Recommended!)
if (process.env.GEMINI_API_KEY) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Groq (FREE & Fast)
if (process.env.GROQ_API_KEY) {
  const Groq = require('groq-sdk');
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini'; // Default to Gemini

// Preprocess image for better OCR (handles all supported formats)
async function preprocessImage(buffer, mimetype) {
  try {
    // Enhance image quality for better OCR
    const enhanced = sharp(buffer)
      .greyscale() // Convert to grayscale
      .normalize() // Normalize contrast
      .sharpen(); // Sharpen text

    // Convert based on MIME type
    const mimeTypeLower = mimetype.toLowerCase();

    if (mimeTypeLower.includes('jpeg') || mimeTypeLower.includes('jpg')) {
      return await enhanced.jpeg({ quality: 95 }).toBuffer();
    } else if (mimeTypeLower.includes('png')) {
      return await enhanced.png().toBuffer();
    } else if (mimeTypeLower.includes('webp')) {
      return await enhanced.webp({ quality: 95 }).toBuffer();
    } else if (mimeTypeLower.includes('tiff') || mimeTypeLower.includes('tif')) {
      return await enhanced.tiff().toBuffer();
    } else {
      // For other formats (GIF, BMP, HEIC, HEIF), convert to PNG for best compatibility
      return await enhanced.png().toBuffer();
    }
  } catch (error) {
    console.error('Image preprocessing error:', error);
    return buffer; // Return original if preprocessing fails
  }
}

// AI Vision-powered parsing - Direct image to AI (no OCR needed!)
async function parseMenuWithAIVision(imageBuffer, mimetype) {
  const prompt = `Extract ALL menu items from this image. Return ONLY a valid JSON array of objects with this exact structure:
[
  {
    "name": "item name",
    "description": "item description (optional)",
    "price": 0.00,
    "currency": "USD",
    "category": "category name"
  }
]

Rules:
- Extract ALL visible menu items from the image
- Price must be a number (not string)
- Description can be empty string if not available
- Currency should be the 3-letter code (USD, EUR, GBP, INR, AED, SAR, etc.) based on the currency symbol or text in the menu. Look for $, €, £, ₹, د.إ, ﷼, ¥, etc.
- If you see $ without country specification, assume USD
- If you see ₹ or Rs or INR, use INR
- If you see € or EUR, use EUR
- If you see £ or GBP, use GBP
- If currency is unclear, use USD as default
- Category should be one of: appetizers, mains, desserts, beverages, sides, or uncategorized
- Do not include currency symbols in the price number
- Return ONLY the JSON array, no other text
- Be thorough and extract every item you can see`;

  try {
    let responseText = null;

    // Try Gemini Vision (FREE & Best for images!)
    if (AI_PROVIDER === 'gemini' && gemini) {
      console.log('🖼️  Using Gemini 2.0 Flash Vision (FREE) - Direct image analysis');

      try {
        const model = gemini.getGenerativeModel({
          model: 'gemini-2.0-flash-exp',
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 3000,
            topP: 0.95,
            topK: 40
          }
        });

        // Prepare image data for Gemini
        const imageData = {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: mimetype
          }
        };

        const result = await model.generateContent([prompt, imageData]);
        const response = await result.response;
        responseText = response.text();

        console.log('✅ Gemini Vision analysis complete');
      } catch (geminiError) {
        console.error('Gemini Vision error:', geminiError.message);
        // Will fall through to other providers
      }
    }
    // Try OpenAI Vision (GPT-4 Vision)
    else if (AI_PROVIDER === 'openai' && openai) {
      console.log('🖼️  Using OpenAI GPT-4 Vision');

      try {
        const base64Image = imageBuffer.toString('base64');
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimetype};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 3000
        });
        responseText = completion.choices[0].message.content;
        console.log('✅ OpenAI Vision analysis complete');
      } catch (openaiError) {
        console.error('OpenAI Vision error:', openaiError.message);
      }
    }
    // Try Groq Vision (Llama 3.2 Vision)
    else if (AI_PROVIDER === 'groq' && groq) {
      console.log('🖼️  Using Groq Llama 3.2 Vision (FREE)');

      try {
        const base64Image = imageBuffer.toString('base64');
        const completion = await groq.chat.completions.create({
          model: 'llama-3.2-90b-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimetype};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 3000
        });
        responseText = completion.choices[0].message.content;
        console.log('✅ Groq Vision analysis complete');
      } catch (groqError) {
        console.error('Groq Vision error:', groqError.message);
      }
    }
    else {
      console.log('No AI Vision provider configured');
      return null;
    }

    if (!responseText) return null;

    // Clean response - remove markdown code blocks if present
    let cleanedText = responseText.trim();
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Extract JSON from response
    const jsonMatch = cleanedText.match(/\[([\s\S]*?)\]/);
    if (jsonMatch) {
      try {
        const items = JSON.parse('[' + jsonMatch[1] + ']');
        console.log(`✅ Successfully parsed ${items.length} items from AI Vision`);
        return items.map(item => ({
          name: item.name || 'Unnamed Item',
          description: item.description || '',
          price: parseFloat(item.price) || 0,
          currency: (item.currency || 'USD').toUpperCase(),
          category: item.category || 'uncategorized'
        }));
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('AI Vision parsing error:', error.message);
    return null;
  }
}

// AI-powered parsing with multiple provider support (Text-based)
async function parseMenuWithAI(extractedText) {
  const prompt = `Extract menu items from the following text. Return ONLY a valid JSON array of objects with this exact structure:
[
  {
    "name": "item name",
    "description": "item description (optional)",
    "price": 0.00,
    "currency": "USD",
    "category": "category name"
  }
]

Rules:
- Price must be a number (not string)
- Description can be empty string if not available
- Currency should be the 3-letter code (USD, EUR, GBP, INR, AED, SAR, etc.) based on currency symbols in text. Look for $, €, £, ₹, Rs, د.إ, ﷼, ¥, etc.
- If you see $ assume USD, ₹ or Rs use INR, € use EUR, £ use GBP
- If currency is unclear, use USD as default
- Category should be one of: appetizers, mains, desserts, beverages, sides, or uncategorized
- Do not include currency symbols in price
- Return ONLY the JSON array, no other text

Menu text:
${extractedText}`;

  try {
    let responseText = null;

    // Try Gemini first (FREE!)
    if (AI_PROVIDER === 'gemini' && gemini) {
      console.log('Using Google Gemini 2.0 Flash (FREE)');

      try {
        // Use Gemini 2.0 Flash - optimized for menu parsing
        const model = gemini.getGenerativeModel({
          model: 'gemini-2.0-flash-exp', // Latest Gemini 2.0 experimental
          generationConfig: {
            temperature: 0.1,        // Low temperature for consistent output
            maxOutputTokens: 2000,   // Enough for large menus
            topP: 0.95,
            topK: 40
          }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        responseText = response.text();

        console.log('✅ Gemini 2.0 response received');
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError.message);
        // Will fall through to other providers or basic parsing
      }
    }
    // Try Groq (FREE & Fast)
    else if (AI_PROVIDER === 'groq' && groq) {
      console.log('Using Groq Llama 3.3 70B (FREE & Ultra Fast)');
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // Latest Llama 3.3 70B model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,  // Low temperature for consistent output
        max_tokens: 2000
      });
      responseText = completion.choices[0].message.content;
      console.log('✅ Groq response received');
    }
    // Try OpenAI (Paid)
    else if (AI_PROVIDER === 'openai' && openai) {
      console.log('Using OpenAI');
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      });
      responseText = completion.choices[0].message.content;
    }
    else {
      console.log('No AI provider configured, using basic parsing');
      return null; // Fall back to basic parsing
    }

    if (!responseText) return null;

    // Clean response - remove markdown code blocks if present
    let cleanedText = responseText.trim();
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Extract JSON from response
    const jsonMatch = cleanedText.match(/\[([\s\S]*?)\]/);
    if (jsonMatch) {
      try {
        const items = JSON.parse('[' + jsonMatch[1] + ']');
        console.log(`✅ Successfully parsed ${items.length} items from AI response`);
        return items.map(item => ({
          name: item.name || 'Unnamed Item',
          description: item.description || '',
          price: parseFloat(item.price) || 0,
          currency: (item.currency || 'USD').toUpperCase(),
          category: item.category || 'uncategorized'
        }));
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('AI parsing error:', error.message);
    return null; // Fall back to basic parsing
  }
}

// @desc    Upload menu image/PDF and extract items using AI Vision or OCR
// @route   POST /api/menu/upload
// @access  Private
exports.uploadMenuWithOCR = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError('Please upload a file', 400);
    }

    const userId = req.user.id;
    const file = req.file;
    let parsedItems = null;
    let extractedText = '';

    // Handle image files with AI Vision FIRST (most accurate!)
    if (file.mimetype.startsWith('image/')) {
      console.log('📷 Image uploaded, attempting AI Vision parsing...');
      console.log('Original file size:', (file.buffer.length / 1024).toFixed(2), 'KB');

      // Try AI Vision first (pass image directly to AI)
      parsedItems = await parseMenuWithAIVision(file.buffer, file.mimetype);

      // If AI Vision succeeds, we're done!
      if (parsedItems && parsedItems.length > 0) {
        console.log(`🎉 AI Vision successfully extracted ${parsedItems.length} items!`);

        return res.status(200).json({
          success: true,
          message: `Found ${parsedItems.length} menu items using AI Vision. Please review and confirm.`,
          data: {
            items: parsedItems,
            needsManualReview: true,
            method: 'ai_vision'
          }
        });
      }

      // If AI Vision fails, fall back to OCR + AI parsing
      console.log('⚠️ AI Vision failed, falling back to OCR...');

      let processedBuffer = file.buffer;

      // Try preprocessing, fall back to original if it fails
      try {
        console.log(`Preprocessing ${file.mimetype} image...`);
        processedBuffer = await preprocessImage(file.buffer, file.mimetype);
        console.log('✅ Preprocessed successfully');
      } catch (preprocessError) {
        console.error('Preprocessing failed, using original image:', preprocessError.message);
        processedBuffer = file.buffer;
      }

      console.log('Running OCR with Tesseract...');
      try {
        const result = await Tesseract.recognize(processedBuffer, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`);
            }
          }
        });
        extractedText = result.data.text;
        console.log('✅ OCR completed. Extracted text length:', extractedText.length);
      } catch (ocrError) {
        console.error('OCR Error:', ocrError.message);
        // Try with original buffer if preprocessed failed
        if (processedBuffer !== file.buffer) {
          console.log('Retrying OCR with original image...');
          const result = await Tesseract.recognize(file.buffer, 'eng');
          extractedText = result.data.text;
          console.log('✅ OCR completed with original image. Text length:', extractedText.length);
        } else {
          throw ocrError;
        }
      }
    }
    // Handle PDF files (use text extraction + AI parsing)
    else if (file.mimetype === 'application/pdf') {
      console.log('📄 PDF uploaded, extracting text...');
      try {
        const dataBuffer = file.buffer;
        const pdfData = await pdf(dataBuffer);
        extractedText = pdfData.text;
        console.log('✅ PDF text extracted. Text length:', extractedText.length);

        if (!extractedText || extractedText.trim().length < 10) {
          throw new ApiError('Could not extract readable text from PDF. The PDF might be image-based or encrypted.', 400);
        }
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError.message);
        throw new ApiError('Failed to parse PDF file. Please ensure it contains text or try converting to an image format.', 400);
      }
    }
    else {
      throw new ApiError('Unsupported file type. Please upload an image or PDF', 400);
    }

    // Try AI text parsing (for OCR'd text or PDF text)
    console.log('Attempting AI-powered text parsing...');
    console.log('Extracted text preview:', extractedText.substring(0, 200));

    parsedItems = await parseMenuWithAI(extractedText);

    // Fall back to basic parsing if AI fails
    if (!parsedItems || parsedItems.length === 0) {
      console.log('AI parsing failed or returned no items, using basic parsing...');
      parsedItems = parseMenuText(extractedText);
      console.log(`Basic parsing found ${parsedItems.length} items`);
    }

    if (parsedItems.length === 0) {
      // Return extracted text for manual review
      return res.status(200).json({
        success: true,
        message: 'Text extracted but no items found automatically. Please review and add items manually.',
        data: {
          extractedText,
          items: [],
          needsManualReview: true
        }
      });
    }

    // Don't auto-save - return items for review
    res.status(200).json({
      success: true,
      message: `Found ${parsedItems.length} menu items. Please review and confirm.`,
      data: {
        extractedText,
        items: parsedItems,
        needsManualReview: true
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
};

// Helper function to parse menu text and extract items (improved algorithm)
function parseMenuText(text) {
  const items = [];
  const lines = text.split('\n').filter(line => line.trim());

  // Multiple price patterns to catch different formats
  const pricePatterns = [
    /(?:[$₹€£¥₣₤₱₩]\s*)(\d+(?:[.,]\d{1,2})?)/g,  // With currency symbol
    /(\d+[.,]\d{2})(?:\s*(?:$|₹|€|£|USD|INR|EUR|GBP))?/g,  // Price with optional currency after
    /(?:Rs\.?|USD|INR)\s*(\d+(?:[.,]\d{1,2})?)/g,  // Rs., USD, INR prefix
    new RegExp('(\\d+)(?:\\.\\d{2})?\\s*(?:only|/-)', 'gi')  // Price with "only" or "/-"
  ];

  // Category detection
  const categoryKeywords = {
    appetizers: ['appetizer', 'starter', 'soup', 'salad'],
    mains: ['main', 'entrée', 'entree', 'curry', 'rice', 'noodles', 'pasta', 'pizza', 'burger'],
    desserts: ['dessert', 'sweet', 'ice cream', 'cake', 'pastry'],
    beverages: ['drink', 'beverage', 'coffee', 'tea', 'juice', 'smoothie', 'shake'],
    sides: ['side', 'bread', 'fries', 'chips']
  };

  let currentCategory = 'uncategorized';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip very short lines
    if (line.length < 3) continue;

    // Check if this line is a category header
    const lowerLine = line.toLowerCase();
    let isCategoryHeader = false;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerLine.includes(keyword)) && line.length < 40) {
        currentCategory = category;
        isCategoryHeader = true;
        break;
      }
    }

    if (isCategoryHeader) continue;

    // Try to extract price using multiple patterns
    let price = 0;
    let priceMatch = null;
    let matchedPattern = null;

    for (const pattern of pricePatterns) {
      const matches = Array.from(line.matchAll(pattern));
      if (matches.length > 0) {
        // Take the last match (usually the price)
        priceMatch = matches[matches.length - 1];
        matchedPattern = pattern;
        const priceStr = priceMatch[1].replace(',', '.');
        price = parseFloat(priceStr);
        if (price > 0) break;
      }
    }

    if (priceMatch && price > 0) {
      // Extract name (everything before the price)
      let name = line.substring(0, priceMatch.index).trim();

      // Clean up name
      name = name.replace(/[-:.…]+$/, '').trim();
      name = name.replace(/^\d+\.?\s*/, ''); // Remove numbering
      name = name.replace(/\.{2,}/g, '').trim(); // Remove dots

      // Skip if name is too short or looks like a header
      if (name.length < 2 || /^[A-Z\s]{20,}$/.test(name)) {
        continue;
      }

      // Extract description (next 1-2 lines if available)
      let description = '';
      let linesToSkip = 0;

      for (let j = 1; j <= 2 && i + j < lines.length; j++) {
        const nextLine = lines[i + j].trim();

        // Check if next line is a description (no price pattern)
        let hasPrice = false;
        for (const pattern of pricePatterns) {
          if (pattern.test(nextLine)) {
            hasPrice = true;
            break;
          }
        }

        if (!hasPrice && nextLine.length > 5 && nextLine.length < 200) {
          description += (description ? ' ' : '') + nextLine;
          linesToSkip = j;
        } else {
          break;
        }
      }

      if (name && price > 0) {
        items.push({
          name: name.substring(0, 100), // Limit name length
          description: description.substring(0, 500), // Limit description length
          price: Math.round(price * 100) / 100, // Round to 2 decimals
          category: currentCategory
        });

        i += linesToSkip; // Skip lines used for description
      }
    }
  }

  return items;
}

// @desc    Get owner's menu items
// @route   GET /api/menu/owner
// @access  Private
exports.getOwnerMenu = async (req, res, next) => {
  try {
    const userId = req.user.role === 'staff' && req.user.ownerId
      ? req.user.ownerId
      : req.user._id;

    const items = await MenuItem.find({ userId, isActive: true })
      .sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: {
        items: items.map(item => ({
          id: item._id,
          name: item.name,
          description: item.description,
          price: item.price,
          currency: item.currency || 'INR',
          category: item.category,
          image: item.image,
          isAvailable: item.isAvailable,
          isVeg: item.isVeg,
          spiceLevel: item.spiceLevel,
          preparationTime: item.preparationTime,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public menu by slug
// @route   GET /api/menu/:slug
// @access  Public
exports.getPublicMenu = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { token } = req.query; // Get token from query params

    const User = require('../models/User');
    const QRCode = require('../models/QRCode');

    let user;
    let tableNumber = null;

    // If token is provided, use it to find the user
    if (token) {
      const qrCode = await QRCode.findOne({ token, isActive: true }).populate('userId');
      if (!qrCode) {
        throw new ApiError('Invalid QR code', 404);
      }
      user = qrCode.userId;
      tableNumber = qrCode.tableNumber;
    } else {
      // Find user by restaurant name slug
      const restaurantName = slug.replace(/-/g, ' ');

      user = await User.findOne({
        restaurantName: new RegExp(`^${restaurantName}$`, 'i')
      });

      if (!user) {
        throw new ApiError('Restaurant not found', 404);
      }
    }

    const items = await MenuItem.find({
      userId: user._id,
      isActive: true,
      isAvailable: true
    }).sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: {
        restaurant: {
          name: user.restaurantName,
          description: user.restaurantDescription,
          address: user.restaurantAddress,
          restaurantLogo: user.restaurantLogo
        },
        tableNumber,
        items: items.map(item => ({
          id: item._id,
          name: item.name,
          description: item.description,
          price: item.price,
          currency: item.currency || 'INR',
          category: item.category,
          image: item.image,
          isVeg: item.isVeg,
          spiceLevel: item.spiceLevel,
          preparationTime: item.preparationTime
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add menu item manually
// @route   POST /api/menu/items
// @access  Private
exports.addMenuItem = async (req, res, next) => {
  try {
    const { name, description, price, currency, category, image, isVeg, spiceLevel, preparationTime } = req.body;
    const userId = req.user.id;

    console.log('Adding menu item with currency:', currency);

    const item = await MenuItem.create({
      userId,
      name,
      description: description || '',
      price,
      currency: currency || 'INR',
      category,
      image: image || '',
      isVeg: isVeg !== undefined ? isVeg : true,
      spiceLevel: spiceLevel || 'none',
      preparationTime: preparationTime || 15
    });

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      data: {
        item: {
          id: item._id,
          name: item.name,
          description: item.description,
          price: item.price,
          currency: item.currency,
          category: item.category,
          image: item.image,
          isAvailable: item.isAvailable,
          isVeg: item.isVeg,
          spiceLevel: item.spiceLevel,
          preparationTime: item.preparationTime
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/items/:id
// @access  Private
exports.updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      throw new ApiError('Menu item not found', 404);
    }

    // Check ownership
    if (item.userId.toString() !== req.user.id) {
      throw new ApiError('Not authorized to update this item', 403);
    }

    const { name, description, price, currency, category, image, isAvailable, isVeg, spiceLevel, preparationTime } = req.body;

    // Update fields
    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = price;
    if (currency !== undefined) item.currency = currency;
    if (category !== undefined) item.category = category;
    if (image !== undefined) item.image = image;
    if (isAvailable !== undefined) item.isAvailable = isAvailable;
    if (isVeg !== undefined) item.isVeg = isVeg;
    if (spiceLevel !== undefined) item.spiceLevel = spiceLevel;
    if (preparationTime !== undefined) item.preparationTime = preparationTime;

    await item.save();

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: {
        item: {
          id: item._id,
          name: item.name,
          description: item.description,
          price: item.price,
          currency: item.currency,
          category: item.category,
          image: item.image,
          isAvailable: item.isAvailable,
          isVeg: item.isVeg,
          spiceLevel: item.spiceLevel,
          preparationTime: item.preparationTime
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/items/:id
// @access  Private
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      throw new ApiError('Menu item not found', 404);
    }

    // Check ownership
    if (item.userId.toString() !== req.user.id) {
      throw new ApiError('Not authorized to delete this item', 403);
    }

    // Hard delete
    await MenuItem.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete all menu items for user
// @route   DELETE /api/menu/items
// @access  Private
exports.deleteAllMenuItems = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Count items before deletion
    const count = await MenuItem.countDocuments({ userId });

    if (count === 0) {
      return res.status(200).json({
        success: true,
        message: 'No items to delete',
        data: { deletedCount: 0 }
      });
    }

    // Delete all items for this user
    const result = await MenuItem.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} menu items`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Delete all items error:', error);
    next(error);
  }
};

// @desc    Update menu (bulk update)
// @route   PUT /api/menu
// @access  Private
exports.updateMenu = async (req, res, next) => {
  try {
    const { items } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError('Please provide items array', 400);
    }

    const updatedItems = [];

    for (const itemData of items) {
      if (itemData.id) {
        // Update existing item
        const item = await MenuItem.findOneAndUpdate(
          { _id: itemData.id, userId },
          itemData,
          { new: true, runValidators: true }
        );
        if (item) updatedItems.push(item);
      } else {
        // Create new item
        const item = await MenuItem.create({
          userId,
          ...itemData
        });
        updatedItems.push(item);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Menu updated successfully',
      data: { items: updatedItems }
    });
  } catch (error) {
    next(error);
  }
};
