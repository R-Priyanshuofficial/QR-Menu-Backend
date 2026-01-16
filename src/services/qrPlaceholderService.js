const sharp = require('sharp');
const path = require('path');

/**
 * Add restaurant name text at the top of QR placeholder
 * @param {Buffer} qrBuffer - QR code image buffer
 * @param {string} restaurantName - Name to display
 * @param {object} style - Text styling options
 * @returns {Promise<Buffer>} QR with restaurant name
 */
const addRestaurantName = async (qrBuffer, restaurantName, style = {}) => {
  const {
    fontSize = 48,
    fontWeight = 'bold',
    color = '#000000',
    backgroundColor = '#FFFFFF',
    padding = 30,
    letterSpacing = 2,
    decorative = 'none'
  } = style;

  const qrImage = sharp(qrBuffer);
  const qrMetadata = await qrImage.metadata();
  const qrWidth = qrMetadata.width;

  // Header height calculation
  const textHeight = fontSize + (padding * 3) + (decorative === 'artDeco' ? 50 : 20);

  // 1. DEFINE PATTERNS & GRADIENTS
  const defs = `
    <defs>
      <!-- Real Metallic Gold Gradient -->
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#BF953F;stop-opacity:1" />
        <stop offset="25%" style="stop-color:#FCF6BA;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#B38728;stop-opacity:1" />
        <stop offset="75%" style="stop-color:#FBF5B7;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#AA771C;stop-opacity:1" />
      </linearGradient>

      <!-- Platinum/Silver Gradient -->
      <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#9CA3AF;stop-opacity:1" />
        <stop offset="25%" style="stop-color:#E2E8F0;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#CBD5E1;stop-opacity:1" />
        <stop offset="75%" style="stop-color:#F8FAFC;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#64748B;stop-opacity:1" />
      </linearGradient>

      <!-- Rose Gold Gradient -->
      <linearGradient id="roseGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#CB9CA1;stop-opacity:1" />
        <stop offset="25%" style="stop-color:#FFDDE1;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#EE9CA7;stop-opacity:1" />
        <stop offset="75%" style="stop-color:#FFDDE1;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B46C75;stop-opacity:1" />
      </linearGradient>
      
      <!-- Dark Luxury Backgrounds -->
      <linearGradient id="luxuryBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#0F172A;stop-opacity:1" /> 
        <stop offset="100%" style="stop-color:#1E293B;stop-opacity:1" /> 
      </linearGradient>
      
      <linearGradient id="darkBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#1A202C;stop-opacity:1" /> 
        <stop offset="100%" style="stop-color:#2D3748;stop-opacity:1" /> 
      </linearGradient>
      
       <linearGradient id="warmBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#2B1810;stop-opacity:1" /> 
        <stop offset="100%" style="stop-color:#4A2C21;stop-opacity:1" /> 
      </linearGradient>

      <!-- Text Shadow -->
      <filter id="metalShadow">
        <feDropShadow dx="2" dy="2" stdDeviation="1" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>
  `;

  // 2. DEFINE DECORATIVE FRAMES
  let decorativeElement = '';
  let bgFill = `fill="${backgroundColor}"`;
  let textColor = color;
  let gradientId = 'goldGrad'; // Default
  let bgGradientId = 'luxuryBg';

  // Determine gradient based on style prop if available
  if (style.gradient === 'silver') {
    gradientId = 'silverGrad';
    bgGradientId = 'darkBg';
  } else if (style.gradient === 'roseGold') {
    gradientId = 'roseGoldGrad';
    bgGradientId = 'warmBg';
  }

  if (decorative === 'artDeco') {
    // Override colors for Art Deco mode
    bgFill = `fill="url(#${bgGradientId})"`;
    textColor = `url(#${gradientId})`; 
    
    decorativeElement = `
      <!-- Art Deco Fan Corner (Top Left) -->
      <path d="M 20 80 L 20 20 L 80 20" stroke="url(#${gradientId})" stroke-width="3" fill="none"/>
      <path d="M 25 80 L 25 25 L 80 25" stroke="url(#${gradientId})" stroke-width="1" fill="none"/>
      <line x1="20" y1="20" x2="80" y2="80" stroke="url(#${gradientId})" stroke-width="1" opacity="0.5"/>
      <line x1="20" y1="20" x2="60" y2="80" stroke="url(#${gradientId})" stroke-width="1" opacity="0.3"/>
      <line x1="20" y1="20" x2="80" y2="60" stroke="url(#${gradientId})" stroke-width="1" opacity="0.3"/>

      <!-- Art Deco Fan Corner (Top Right) -->
      <path d="M ${qrWidth-20} 80 L ${qrWidth-20} 20 L ${qrWidth-80} 20" stroke="url(#${gradientId})" stroke-width="3" fill="none"/>
      <path d="M ${qrWidth-25} 80 L ${qrWidth-25} 25 L ${qrWidth-80} 25" stroke="url(#${gradientId})" stroke-width="1" fill="none"/>
      <line x1="${qrWidth-20}" y1="20" x2="${qrWidth-80}" y2="80" stroke="url(#${gradientId})" stroke-width="1" opacity="0.5"/>
      <line x1="${qrWidth-20}" y1="20" x2="${qrWidth-60}" y2="80" stroke="url(#${gradientId})" stroke-width="1" opacity="0.3"/>
      <line x1="${qrWidth-20}" y1="20" x2="${qrWidth-80}" y2="60" stroke="url(#${gradientId})" stroke-width="1" opacity="0.3"/>

      <!-- Center Geometric Accent -->
      <path d="M ${qrWidth/2 - 100} ${textHeight - 15} L ${qrWidth/2 + 100} ${textHeight - 15}" stroke="url(#${gradientId})" stroke-width="2"/>
      <circle cx="${qrWidth/2}" cy="${textHeight - 15}" r="5" fill="url(#${gradientId})"/>
      <rect x="${qrWidth/2 - 4}" y="${textHeight - 19}" width="8" height="8" transform="rotate(45 ${qrWidth/2} ${textHeight - 15})" fill="none" stroke="url(#${gradientId})"/>
    `;
  } else if (decorative === 'frame') {
    // The previous baroque frame logic...
    // (Kept simple here for brevity, but referencing the ornate pattern we made before)
     decorativeElement = `
      <rect x="8%" y="10%" width="84%" height="${textHeight - 20}%" 
            fill="none" stroke="${color}" stroke-width="3" rx="15"/>
     `;
  }

  const textSvg = Buffer.from(
    `<svg width="${qrWidth}" height="${textHeight}" xmlns="http://www.w3.org/2000/svg">
      ${defs}
      <rect x="0" y="0" width="${qrWidth}" height="${textHeight}" ${bgFill}/>
      ${decorativeElement}
      
      <text 
        x="50%" 
        y="50%" 
        font-family="Georgia, 'Times New Roman', serif" 
        font-size="${fontSize}" 
        font-weight="${fontWeight}"
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="middle"
        letter-spacing="${letterSpacing}"
        filter="url(#goldShadow)">
        ${restaurantName.toUpperCase()}
      </text>
    </svg>`
  );

  return await qrImage
    .extend({
      top: textHeight,
      background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent to let subsequent composites handle background if needed, but we draw rect above.
    })
    .composite([{
      input: textSvg,
      top: 0,
      left: 0
    }])
    .png()
    .toBuffer();
};

/**
 * Add "Powered by QR Menu" branding at bottom-right
 * @param {Buffer} imageBuffer - Image buffer
 * @param {object} style - Branding styling options
 * @returns {Promise<Buffer>} Image with branding
 */
const addBranding = async (imageBuffer, style = {}) => {
  const {
    fontSize = 14,
    color = '#666666',
    padding = 15
  } = style;

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  // Create enhanced branding SVG with icon and gradient
  const brandingHeight = fontSize + (padding * 2.5);
  const brandingSvg = Buffer.from(
    `<svg width="${width}" height="${brandingHeight}">
      <!-- Subtle gradient background -->
      <defs>
        <linearGradient id="bgBrandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#fafafa;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect x="0" y="0" width="${width}" height="${brandingHeight}" fill="url(#bgBrandGrad)"/>
      
      <!-- Decorative top border -->
      <line x1="0" y1="0" x2="${width}" y2="0" stroke="#e0e0e0" stroke-width="1"/>
      
      <!-- QR Code Icon (decorative) -->
      <g transform="translate(${width - 180}, ${brandingHeight / 2 - 8})">
        <rect x="0" y="0" width="4" height="4" fill="${color}" opacity="0.4"/>
        <rect x="6" y="0" width="4" height="4" fill="${color}" opacity="0.4"/>
        <rect x="0" y="6" width="4" height="4" fill="${color}" opacity="0.4"/>
        <rect x="6" y="6" width="4" height="4" fill="${color}" opacity="0.4"/>
      </g>
      
      <!-- Text with shadow -->
      <text 
        x="${width - padding - 15}" 
        y="${brandingHeight / 2 + 1}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${fontSize}" 
        font-weight="normal"
        fill="#00000010" 
        text-anchor="end" 
        dominant-baseline="middle">
        Powered by <tspan font-weight="bold">QR Menu</tspan>
      </text>
      
      <!-- Main text -->
      <text 
        x="${width - padding - 15}" 
        y="${brandingHeight / 2}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${fontSize}" 
        font-weight="normal"
        fill="${color}" 
        text-anchor="end" 
        dominant-baseline="middle">
        Powered by <tspan fill="url(#brandGrad)" font-weight="bold">QR Menu</tspan>
      </text>
    </svg>`
  );

  // Add branding at bottom
  return await image
    .extend({
      bottom: brandingHeight,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .composite([{
      input: brandingSvg,
      top: height,
      left: 0
    }])
    .png()
    .toBuffer();
};

/**
 * Generate complete professional QR placeholder
 * @param {string} url - URL to encode
 * @param {object} options - Design options
 * @returns {Promise<Buffer>} Complete QR placeholder
 */
const generatePlaceholderDesign = async (url, options = {}) => {
  const {
    restaurantName,
    template,
    logoUrl,
    avatarId,
    tableNumber,
    showTableNumber,
    designSpec  // ADD THIS - AI design specification
  } = options;

  const { generateCustomizedQR } = require('./qrService');

  // Determine QR colors - use design overrides for luxury themes, else use template
  let qrColorToUse = template.qrColor;
  let bgColorToUse = template.backgroundColor;
  let borderColorToUse = template.borderColor;

  // Apply luxury design overrides if available
  if (designSpec && designSpec.qrOverride) {
    qrColorToUse = designSpec.qrOverride.qrColor || qrColorToUse;
    bgColorToUse = designSpec.qrOverride.backgroundColor || bgColorToUse;
    borderColorToUse = designSpec.qrOverride.borderColor || borderColorToUse;
  }

  // Step 1: Generate base QR with customization
  let qrBuffer = await generateCustomizedQR(url, {
    qrColor: qrColorToUse,
    backgroundColor: bgColorToUse,
    logoUrl,
    avatarId,
    borderStyle: template.borderStyle,
    borderColor: borderColorToUse,
    showTableNumber,
    tableNumber
  });

  // Step 2: Add restaurant name at top (with AI variations)
  if (restaurantName && designSpec) {
    const headerStyle = designSpec.header;
    const layoutStyle = designSpec.layout;
    
    qrBuffer = await addRestaurantName(qrBuffer, restaurantName, {
      fontSize: headerStyle.fontSize || 42,
      fontWeight: headerStyle.fontWeight || 'bold',
      letterSpacing: headerStyle.letterSpacing || 2,
      color: template.qrColor,
      backgroundColor: template.backgroundColor,
      padding: layoutStyle.padding || 25,
      decorative: headerStyle.decorative || 'none',
      gradient: headerStyle.gradient // Pass the gradient style (gold, silver, etc)
    });
  } else if (restaurantName) {
    // Fallback without design spec
    qrBuffer = await addRestaurantName(qrBuffer, restaurantName, {
      fontSize: 42,
      fontWeight: 'bold',
      color: template.qrColor,
      backgroundColor: template.backgroundColor,
      padding: 25
    });
  }

  // Step 3: Add branding at bottom (with AI variations)
  if (designSpec && designSpec.branding) {
    const brandingStyle = designSpec.branding;
    qrBuffer = await addBranding(qrBuffer, {
      fontSize: brandingStyle.size === 'medium' ? 14 : 12,
      color:  brandingStyle.style === 'prominent' ? '#666666' : '#999999',
      padding: 12,
      position: brandingStyle.position || 'bottom-right'
    });
  } else {
    qrBuffer = await addBranding(qrBuffer, {
      fontSize: 12,
      color: '#999999',
      padding: 12
    });
  }

  // Step 4: Add outer border/frame with ornate baroque styling
  const image = sharp(qrBuffer);
  const metadata = await image.metadata();
  const framePadding = designSpec && designSpec.layout ? designSpec.layout.padding : 25;

  // Parse border color (use override if available)
  const borderColor = borderColorToUse;
  const r = parseInt(borderColor.slice(1, 3), 16);
  const g = parseInt(borderColor.slice(3, 5), 16);
  const b = parseInt(borderColor.slice(5, 7), 16);

  // Create ornate border frame with decorative patterns
  const outerFrameWidth = metadata.width + (framePadding * 2);
  const outerFrameHeight = metadata.height + (framePadding * 2);

  // Define Styles based on template
  let frameSVGContent = '';
  
  if (designSpec && designSpec.layout && designSpec.layout.style === 'luxury') {
    // Determine Gradient ID based on design spec
    let gradientId = 'frameGoldGrad';
    let gradientStops = `
         <stop offset="0%" style="stop-color:#BF953F;stop-opacity:1" />
        <stop offset="25%" style="stop-color:#FCF6BA;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#B38728;stop-opacity:1" />
        <stop offset="75%" style="stop-color:#FBF5B7;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#AA771C;stop-opacity:1" />
    `;
    
    // Check for other gradients
    if (designSpec.header && designSpec.header.gradient === 'silver') {
       gradientId = 'frameSilverGrad';
       gradientStops = `
        <stop offset="0%" style="stop-color:#9CA3AF;stop-opacity:1" />
        <stop offset="25%" style="stop-color:#E2E8F0;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#CBD5E1;stop-opacity:1" />
        <stop offset="75%" style="stop-color:#F8FAFC;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#64748B;stop-opacity:1" />
       `;
    } else if (designSpec.header && designSpec.header.gradient === 'roseGold') {
       gradientId = 'frameRoseGrad';
       gradientStops = `
        <stop offset="0%" style="stop-color:#CB9CA1;stop-opacity:1" />
        <stop offset="25%" style="stop-color:#FFDDE1;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#EE9CA7;stop-opacity:1" />
        <stop offset="75%" style="stop-color:#FFDDE1;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B46C75;stop-opacity:1" />
       `;
    }
    
    const frameBgColor = (designSpec.layout && designSpec.layout.frameColor) ? designSpec.layout.frameColor : '#0F172A';

    // ROYAL ART DECO FRAME
    frameSVGContent = `
    <defs>
      <!-- Gradient -->
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        ${gradientStops}
      </linearGradient>
    </defs>
    
    <!-- Background Frame Dark -->
    <rect x="0" y="0" width="${outerFrameWidth}" height="${outerFrameHeight}" fill="${frameBgColor}"/> 
    
    <!-- Outer Border -->
    <rect x="5" y="5" width="${outerFrameWidth-10}" height="${outerFrameHeight-10}" fill="none" stroke="url(#${gradientId})" stroke-width="5"/>
    <rect x="15" y="15" width="${outerFrameWidth-30}" height="${outerFrameHeight-30}" fill="none" stroke="url(#${gradientId})" stroke-width="1.5"/>
    
    <!-- Inner Border (Touching QR) -->
    <rect x="${framePadding - 5}" y="${framePadding - 5}" width="${metadata.width + 10}" height="${metadata.height + 10}" fill="none" stroke="url(#${gradientId})" stroke-width="2"/>
    
    <!-- Geometric Corners -->
    <path d="M 5 50 L 5 5 L 50 5" stroke="url(#${gradientId})" stroke-width="8" fill="none"/>
    <path d="M ${outerFrameWidth-5} 50 L ${outerFrameWidth-5} 5 L ${outerFrameWidth-50} 5" stroke="url(#${gradientId})" stroke-width="8" fill="none"/>
    <path d="M 5 ${outerFrameHeight-50} L 5 ${outerFrameHeight-5} L 50 ${outerFrameHeight-5}" stroke="url(#${gradientId})" stroke-width="8" fill="none"/>
    <path d="M ${outerFrameWidth-5} ${outerFrameHeight-50} L ${outerFrameWidth-5} ${outerFrameHeight-5} L ${outerFrameWidth-50} ${outerFrameHeight-5}" stroke="url(#${gradientId})" stroke-width="8" fill="none"/>
    
    <!-- Decorative Rays -->
    <line x1="0" y1="0" x2="40" y2="40" stroke="url(#${gradientId})" stroke-width="2"/>
    <line x1="${outerFrameWidth}" y1="0" x2="${outerFrameWidth-40}" y2="40" stroke="url(#${gradientId})" stroke-width="2"/>
    <line x1="0" y1="${outerFrameHeight}" x2="40" y2="${outerFrameHeight-40}" stroke="url(#${gradientId})" stroke-width="2"/>
    <line x1="${outerFrameWidth}" y1="${outerFrameHeight}" x2="${outerFrameWidth-40}" y2="${outerFrameHeight-40}" stroke="url(#${gradientId})" stroke-width="2"/>
    `;
  } else {
     // STANDARD ORNATE FRAME (Previous logic)
     frameSVGContent = `
      <defs>
        <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(${r},${g},${b});stop-opacity:1" />
          <stop offset="50%" style="stop-color:rgb(${Math.min(r + 20, 255)},${Math.min(g + 20, 255)},${Math.min(b + 20, 255)});stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(${r},${g},${b});stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Main background -->
      <rect x="0" y="0" width="${outerFrameWidth}" height="${outerFrameHeight}" fill="rgb(${r},${g},${b})"/>
      
      <!-- Ornate corner decorations (top-left) -->
      <g transform="translate(15, 15)">
        <path d="M 0 25 Q 0 0 25 0" stroke="#ffffff40" stroke-width="2" fill="none"/>
        <path d="M 5 25 Q 5 5 25 5" stroke="#ffffff60" stroke-width="1" fill="none"/>
        <circle cx="0" cy="25" r="3" fill="#ffffffaa"/>
        <circle cx="25" cy="0" r="3" fill="#ffffffaa"/>
      </g>
      
      <!-- Ornate corner decorations (top-right) -->
      <g transform="translate(${outerFrameWidth - 40}, 15)">
        <path d="M 25 25 Q 25 0 0 0" stroke="#ffffff40" stroke-width="2" fill="none"/>
        <path d="M 20 25 Q 20 5 0 5" stroke="#ffffff60" stroke-width="1" fill="none"/>
        <circle cx="25" cy="25" r="3" fill="#ffffffaa"/>
        <circle cx="0" cy="0" r="3" fill="#ffffffaa"/>
      </g>
      
      <!-- Ornate corner decorations (bottom-left) -->
      <g transform="translate(15, ${outerFrameHeight - 40})">
        <path d="M 0 0 Q 0 25 25 25" stroke="#ffffff40" stroke-width="2" fill="none"/>
        <path d="M 5 0 Q 5 20 25 20" stroke="#ffffff60" stroke-width="1" fill="none"/>
        <circle cx="0" cy="0" r="3" fill="#ffffffaa"/>
        <circle cx="25" cy="25" r="3" fill="#ffffffaa"/>
      </g>
      
      <!-- Ornate corner decorations (bottom-right) -->
      <g transform="translate(${outerFrameWidth - 40}, ${outerFrameHeight - 40})">
        <path d="M 25 0 Q 25 25 0 25" stroke="#ffffff40" stroke-width="2" fill="none"/>
        <path d="M 20 0 Q 20 20 0 20" stroke="#ffffff60" stroke-width="1" fill="none"/>
        <circle cx="25" cy="0" r="3" fill="#ffffffaa"/>
        <circle cx="0" cy="25" r="3" fill="#ffffffaa"/>
      </g>
      
      <!-- Side decorative patterns (left) -->
      <line x1="8" y1="${outerFrameHeight * 0.3}" x2="8" y2="${outerFrameHeight * 0.7}" 
            stroke="#ffffff30" stroke-width="1.5"/>
      <circle cx="8" cy="${outerFrameHeight * 0.3}" r="2" fill="#ffffff50"/>
      <circle cx="8" cy="${outerFrameHeight * 0.5}" r="2" fill="#ffffff50"/>
      <circle cx="8" cy="${outerFrameHeight * 0.7}" r="2" fill="#ffffff50"/>
      
      <!-- Side decorative patterns (right) -->
      <line x1="${outerFrameWidth - 8}" y1="${outerFrameHeight * 0.3}" 
            x2="${outerFrameWidth - 8}" y2="${outerFrameHeight * 0.7}" 
            stroke="#ffffff30" stroke-width="1.5"/>
      <circle cx="${outerFrameWidth - 8}" cy="${outerFrameHeight * 0.3}" r="2" fill="#ffffff50"/>
      <circle cx="${outerFrameWidth - 8}" cy="${outerFrameHeight * 0.5}" r="2" fill="#ffffff50"/>
      <circle cx="${outerFrameWidth - 8}" cy="${outerFrameHeight * 0.7}" r="2" fill="#ffffff50"/>
      
      <!-- Top/bottom decorative patterns -->
      <line x1="${outerFrameWidth * 0.3}" y1="8" x2="${outerFrameWidth * 0.7}" y2="8" 
            stroke="#ffffff30" stroke-width="1.5"/>
      <circle cx="${outerFrameWidth * 0.3}" cy="8" r="2" fill="#ffffff50"/>
      <circle cx="${outerFrameWidth *0.5}" cy="8" r="2" fill="#ffffff50"/>
      <circle cx="${outerFrameWidth * 0.7}" cy="8" r="2" fill="#ffffff50"/>
      
      <line x1="${outerFrameWidth * 0.3}" y1="${outerFrameHeight - 8}" 
            x2="${outerFrameWidth * 0.7}" y2="${outerFrameHeight - 8}" 
            stroke="#ffffff30" stroke-width="1.5"/>
      <circle cx="${outerFrameWidth * 0.3}" cy="${outerFrameHeight - 8}" r="2" fill="#ffffff50"/>
      <circle cx="${outerFrameWidth * 0.5}" cy="${outerFrameHeight - 8}" r="2" fill="#ffffff50"/>
      <circle cx="${outerFrameWidth * 0.7}" cy="${outerFrameHeight - 8}" r="2" fill="#ffffff50"/>
     `;
  }

  const ornateBorderSVG = Buffer.from(
    `<svg width="${outerFrameWidth}" height="${outerFrameHeight}" xmlns="http://www.w3.org/2000/svg">
      ${frameSVGContent}
    </svg>`
  );

  // Composite the ornate border with the QR image
  qrBuffer = await sharp({
    create: {
      width: outerFrameWidth,
      height: outerFrameHeight,
      channels: 4,
      background: { r, g, b, alpha: 1 }
    }
  })
    .composite([
      { input: ornateBorderSVG, top: 0, left: 0 },
      { input: qrBuffer, top: framePadding, left: framePadding }
    ])
    .png()
    .toBuffer();

  return qrBuffer;
};

module.exports = {
  addRestaurantName,
  addBranding,
  generatePlaceholderDesign
};
