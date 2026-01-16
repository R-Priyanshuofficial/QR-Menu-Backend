const qrcode = require('qrcode');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Generate base QR code as PNG buffer
 * @param {string} url - URL to encode in QR
 * @param {object} options - QR options (color, size, etc)
 * @returns {Promise<Buffer>} PNG buffer
 */
const generateBaseQR = async (url, options = {}) => {
  const {
    qrColor = '#000000',
    backgroundColor = '#FFFFFF',
    width = 600,
    margin = 2
  } = options;

  // Generate QR code as buffer
  const qrBuffer = await qrcode.toBuffer(url, {
    type: 'png',
    width,
    margin,
    color: {
      dark: qrColor,
      light: backgroundColor
    },
    errorCorrectionLevel: 'H' // High error correction for logo overlay
  });

  return qrBuffer;
};

/**
 * Apply logo overlay to QR code
 * @param {Buffer} qrBuffer - Base QR code buffer
 * @param {string} logoPath - Path to logo file
 * @returns {Promise<Buffer>} QR with logo overlay
 */
const applyLogoOverlay = async (qrBuffer, logoPath) => {
  try {
    // Get QR dimensions
    const qrImage = sharp(qrBuffer);
    const qrMetadata = await qrImage.metadata();
    const qrSize = qrMetadata.width;

    // Logo should be ~20% of QR size
    const logoSize = Math.floor(qrSize * 0.2);

    // Process logo: resize, ensure it's square, add white background
    const logoBuffer = await sharp(logoPath)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();

    // Create white circle background for logo (slightly larger)
    const logoBackgroundSize = Math.floor(logoSize * 1.2);
    const logoBackground = await sharp({
      create: {
        width: logoBackgroundSize,
        height: logoBackgroundSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .png()
      .toBuffer();

    // Calculate position to center logo
    const position = Math.floor((qrSize - logoBackgroundSize) / 2);
    const logoPosition = Math.floor((logoBackgroundSize - logoSize) / 2);

    // First, composite the background circle
    const qrWithBackground = await sharp(qrBuffer)
      .composite([{
        input: logoBackground,
        top: position,
        left: position
      }])
      .toBuffer();

    // Then composite the logo on top
    const finalQR = await sharp(qrWithBackground)
      .composite([{
        input: logoBuffer,
        top: position + logoPosition,
        left: position + logoPosition
      }])
      .png()
      .toBuffer();

    return finalQR;
  } catch (error) {
    console.error('Logo overlay error:', error);
    // Return original QR if logo fails
    return qrBuffer;
  }
};

/**
 * Apply avatar overlay to QR code
 * @param {Buffer} qrBuffer - Base QR code buffer
 * @param {string} avatarId - Avatar identifier
 * @returns {Promise<Buffer>} QR with avatar overlay
 */
const applyAvatarOverlay = async (qrBuffer, avatarId) => {
  const avatarPath = path.join(__dirname, '../../public/avatars', `${avatarId}.png`);
  
  try {
    await fs.access(avatarPath);
    return await applyLogoOverlay(qrBuffer, avatarPath);
  } catch (error) {
    console.error(`Avatar ${avatarId} not found:`, error);
    return qrBuffer;
  }
};

/**
 * Add border to QR code
 * @param {Buffer} qrBuffer - QR code buffer
 * @param {string} borderStyle - Border style (square, rounded, circular)
 * @param {string} borderColor - Border color hex
 * @returns {Promise<Buffer>} QR with border
 */
const applyBorder = async (qrBuffer, borderStyle, borderColor) => {
  if (borderStyle === 'none') return qrBuffer;

  const qrImage = sharp(qrBuffer);
  const metadata = await qrImage.metadata();
  const size = metadata.width;
  
  const borderWidth = Math.floor(size * 0.05); // 5% border
  const totalSize = size + (borderWidth * 2);

  // Parse hex color to RGB
  const r = parseInt(borderColor.slice(1, 3), 16);
  const g = parseInt(borderColor.slice(3, 5), 16);
  const b = parseInt(borderColor.slice(5, 7), 16);

  if (borderStyle === 'square') {
    // Simple extend with border color
    return await qrImage
      .extend({
        top: borderWidth,
        bottom: borderWidth,
        left: borderWidth,
        right: borderWidth,
        background: { r, g, b, alpha: 1 }
      })
      .png()
      .toBuffer();
  }

  if (borderStyle === 'rounded') {
    // Create rounded rectangle mask
    const cornerRadius = Math.floor(totalSize * 0.1);
    
    const roundedMask = Buffer.from(
      `<svg width="${totalSize}" height="${totalSize}">
        <rect x="0" y="0" width="${totalSize}" height="${totalSize}" 
              rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/>
      </svg>`
    );

    return await qrImage
      .extend({
        top: borderWidth,
        bottom: borderWidth,
        left: borderWidth,
        right: borderWidth,
        background: { r, g, b, alpha: 1 }
      })
      .composite([{
        input: roundedMask,
        blend: 'dest-in'
      }])
      .png()
      .toBuffer();
  }

  if (borderStyle === 'circular') {
    // Create circular mask
    const circleMask = Buffer.from(
      `<svg width="${totalSize}" height="${totalSize}">
        <circle cx="${totalSize/2}" cy="${totalSize/2}" r="${totalSize/2}" fill="white"/>
      </svg>`
    );

    return await qrImage
      .extend({
        top: borderWidth,
        bottom: borderWidth,
        left: borderWidth,
        right: borderWidth,
        background: { r, g, b, alpha: 1 }
      })
      .composite([{
        input: circleMask,
        blend: 'dest-in'
      }])
      .png()
      .toBuffer();
  }

  return qrBuffer;
};

/**
 * Add table number text to QR code
 * @param {Buffer} qrBuffer - QR code buffer
 * @param {string} tableNumber - Table number to display
 * @returns {Promise<Buffer>} QR with table number
 */
const addTableNumberText = async (qrBuffer, tableNumber) => {
  const qrImage = sharp(qrBuffer);
  const metadata = await qrImage.metadata();
  const width = metadata.width;
  
  // Create text overlay using SVG
  const fontSize = Math.floor(width * 0.08);
  const padding = Math.floor(width * 0.03);
  
  const textSvg = Buffer.from(
    `<svg width="${width}" height="${fontSize + padding * 2}">
      <rect x="0" y="0" width="${width}" height="${fontSize + padding * 2}" 
            fill="white" opacity="0.9"/>
      <text x="50%" y="50%" 
            font-family="Arial, sans-serif" 
            font-size="${fontSize}" 
            font-weight="bold"
            fill="black" 
            text-anchor="middle" 
            dominant-baseline="middle">
        Table ${tableNumber}
      </text>
    </svg>`
  );

  // Add text at bottom of QR
  return await qrImage
    .extend({
      bottom: fontSize + padding * 2,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .composite([{
      input: textSvg,
      top: metadata.height,
      left: 0
    }])
    .png()
    .toBuffer();
};

/**
 * Generate fully customized QR code
 * @param {string} url - URL to encode
 * @param {object} customization - Customization options
 * @returns {Promise<Buffer>} Final QR code buffer
 */
const generateCustomizedQR = async (url, customization = {}) => {
  const {
    qrColor,
    backgroundColor,
    logoUrl,
    avatarId,
    borderStyle,
    borderColor,
    showTableNumber,
    tableNumber
  } = customization;

  // Step 1: Generate base QR
  let qrBuffer = await generateBaseQR(url, { qrColor, backgroundColor });

  // Step 2: Apply logo or avatar (mutually exclusive)
  if (logoUrl) {
    qrBuffer = await applyLogoOverlay(qrBuffer, logoUrl);
  } else if (avatarId) {
    qrBuffer = await applyAvatarOverlay(qrBuffer, avatarId);
  }

  // Step 3: Apply border
  if (borderStyle && borderStyle !== 'none') {
    qrBuffer = await applyBorder(qrBuffer, borderStyle, borderColor);
  }

  // Step 4: Add table number text (for table QRs)
  if (showTableNumber && tableNumber) {
    qrBuffer = await addTableNumberText(qrBuffer, tableNumber);
  }

  return qrBuffer;
};

/**
 * Convert buffer to base64 data URL
 * @param {Buffer} buffer - Image buffer
 * @returns {string} Data URL
 */
const bufferToDataURL = (buffer) => {
  return `data:image/png;base64,${buffer.toString('base64')}`;
};

module.exports = {
  generateBaseQR,
  applyLogoOverlay,
  applyAvatarOverlay,
  applyBorder,
  addTableNumberText,
  generateCustomizedQR,
  bufferToDataURL
};
