const { generateDesignVariations, getDefaultDesigns } = require('../services/geminiDesignService');
const { generatePlaceholderDesign } = require('../services/qrPlaceholderService');
const { bufferToDataURL } = require('../services/qrService');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Generate design variations using AI
 * @route   POST /api/qr/generate-designs
 * @access  Private
 */
exports.generateDesigns = async (req, res, next) => {
  try {
    const {
      restaurantName,
      template,
      qrType,
      tableNumber,
      logoUrl,
      avatarId,
      url
    } = req.body;

    // Input validation
    if (!restaurantName) {
      throw new ApiError('Restaurant name is required', 400);
    }
    if (!url) {
      throw new ApiError('QR URL is required', 400);
    }
    if (!template) {
      throw new ApiError('Template is required', 400);
    }

    const templateId = template.id || 'royal';
    console.log(`🎨 Generating designs for "${restaurantName}" with template "${templateId}"`);

    // ─── ATTEMPT 1: Gemini AI image generation ───
    let designs = null;
    try {
      designs = await generateDesignVariations(restaurantName, templateId);
      if (designs && designs.length > 0) {
        console.log(`✅ Generated ${designs.length} AI image designs`);
      }
    } catch (aiError) {
      console.error('❌ AI image generation failed:', aiError.message);
    }

    // ─── ATTEMPT 2: SVG fallback ───
    if (!designs || designs.length === 0) {
      console.log('📐 Using SVG fallback designs...');
      try {
        const defaultSpecs = getDefaultDesigns(template);

        designs = await Promise.all(
          defaultSpecs.map(async (spec, index) => {
            try {
              console.log(`🖼️  Generating SVG preview ${index + 1}/${defaultSpecs.length}...`);

              const placeholderBuffer = await generatePlaceholderDesign(url, {
                restaurantName,
                template,
                logoUrl,
                avatarId,
                tableNumber,
                showTableNumber: qrType === 'table',
                designSpec: spec
              });

              return {
                ...spec,
                preview: bufferToDataURL(placeholderBuffer),
                isAIGenerated: false
              };
            } catch (previewError) {
              console.error(`⚠️ SVG preview ${index + 1} failed:`, previewError.message);
              return null;
            }
          })
        );

        designs = designs.filter(d => d !== null);
        console.log(`✅ Generated ${designs.length} SVG fallback designs`);
      } catch (fallbackError) {
        console.error('❌ SVG fallback also failed:', fallbackError.message);
        throw new ApiError('Failed to generate design previews. Please try again.', 500);
      }
    }

    if (!designs || designs.length === 0) {
      throw new ApiError('Could not generate any designs. Please try again.', 500);
    }

    res.status(200).json({
      success: true,
      data: { designs }
    });
  } catch (error) {
    console.error('❌ Error in generateDesigns controller:', error.message);
    next(error);
  }
};
