const { generateDesignVariations } = require('../services/geminiDesignService');
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

    console.log(`🎨 Generating designs for: ${restaurantName}`);
    console.log(`📍 QR Type: ${qrType}${qrType === 'table' ? ` (Table ${tableNumber})` : ''}`);

    // Step 1: Get AI-generated design specifications
    let designSpecs;
    try {
      designSpecs = await generateDesignVariations({
        restaurantName,
        template,
        qrType,
        tableNumber
      });
      console.log(`✅ Generated ${designSpecs.length} design specifications`);
    } catch (error) {
      console.error('❌ Error in generateDesignVariations:', error.message);
      throw new ApiError('Failed to generate design variations. Please try again.', 500);
    }

    // Step 2: Generate actual QR placeholder images for each design
    let designs;
    try {
      designs = await Promise.all(
        designSpecs.map(async (spec, index) => {
          try {
            console.log(`🖼️  Generating preview ${index + 1}/${designSpecs.length}...`);
            
            // Generate placeholder with this design spec
            const placeholderBuffer = await generatePlaceholderDesign(url, {
              restaurantName,
              template,
              logoUrl,
              avatarId,
              tableNumber,
              showTableNumber: qrType === 'table',
              designSpec: spec // Pass design spec for custom styling
            });

            return {
              ...spec,
              preview: bufferToDataURL(placeholderBuffer)
            };
          } catch (previewError) {
            // If individual preview fails, log but continue with others
            console.error(`⚠️ Failed to generate preview ${index + 1}:`, previewError.message);
            
            // Return the spec without preview as fallback
            return {
              ...spec,
              preview: null // Frontend can handle this
            };
          }
        })
      );
      
      // Filter out designs with null previews
      designs = designs.filter(d => d.preview !== null);
      
      if (designs.length === 0) {
        throw new Error('All design preview generations failed');
      }
      
      console.log(`✅ Successfully generated ${designs.length} design previews`);
    } catch (error) {
      console.error('❌ Error generating design previews:', error.message);
      console.error('Stack trace:', error.stack);
      throw new ApiError('Failed to generate design previews. Please try again.', 500);
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
