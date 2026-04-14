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

  // Header height 
  const textHeight = fontSize + (padding * 3) + (decorative === 'artDeco' ? 60 : 30);

  // Build custom gradient definition 
  const customGradDef = (style.gradient === 'custom' && style.gradientColors) ? `
      <linearGradient id="customGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${style.gradientColors.start};stop-opacity:1" />
        <stop offset="50%" style="stop-color:${style.gradientColors.mid};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${style.gradientColors.end};stop-opacity:1" />
      </linearGradient>
  ` : '';

  const defs = `
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#BF953F;stop-opacity:1" />
        <stop offset="25%" style="stop-color:#FCF6BA;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#B38728;stop-opacity:1" />
        <stop offset="75%" style="stop-color:#FBF5B7;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#AA771C;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#9CA3AF;stop-opacity:1" />
        <stop offset="25%" style="stop-color:#E2E8F0;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#CBD5E1;stop-opacity:1" />
        <stop offset="75%" style="stop-color:#F8FAFC;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#64748B;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="roseGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#CB9CA1;stop-opacity:1" />
        <stop offset="25%" style="stop-color:#FFDDE1;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#EE9CA7;stop-opacity:1" />
        <stop offset="75%" style="stop-color:#FFDDE1;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#B46C75;stop-opacity:1" />
      </linearGradient>
      ${customGradDef}
      
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

      <filter id="metalShadow">
        <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.5"/>
      </filter>
      <filter id="softGlow">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
  `;

  let decorativeElement = '';
  let bgFill = `fill="${backgroundColor}"`;
  let textColor = color;
  let gradientId = 'goldGrad';
  let bgGradientId = 'luxuryBg';

  if (style.gradient === 'custom' && style.gradientColors) {
    gradientId = 'customGrad';
    bgGradientId = 'luxuryBg';
  } else if (style.gradient === 'silver') {
    gradientId = 'silverGrad';
    bgGradientId = 'darkBg';
  } else if (style.gradient === 'roseGold') {
    gradientId = 'roseGoldGrad';
    bgGradientId = 'warmBg';
  } else if (style.gradient === 'gold') {
    gradientId = 'goldGrad';
    bgGradientId = 'luxuryBg';
  }

  if (decorative === 'artDeco') {
    bgFill = `fill="url(#${bgGradientId})"`;
    textColor = `url(#${gradientId})`;
    
    // Elegant Art Deco corners and center diamond
    decorativeElement = `
      <!-- Art Deco Corners (Top Left) -->
      <path d="M 20 80 L 20 20 L 80 20" stroke="url(#${gradientId})" stroke-width="3" fill="none"/>
      <path d="M 25 75 L 25 25 L 75 25" stroke="url(#${gradientId})" stroke-width="1" fill="none" opacity="0.6"/>
      <line x1="20" y1="20" x2="55" y2="55" stroke="url(#${gradientId})" stroke-width="1" opacity="0.3"/>

      <!-- Art Deco Corners (Top Right) -->
      <path d="M ${qrWidth-20} 80 L ${qrWidth-20} 20 L ${qrWidth-80} 20" stroke="url(#${gradientId})" stroke-width="3" fill="none"/>
      <path d="M ${qrWidth-25} 75 L ${qrWidth-25} 25 L ${qrWidth-75} 25" stroke="url(#${gradientId})" stroke-width="1" fill="none" opacity="0.6"/>

      <!-- Center Diamond & Line -->
      <line x1="${qrWidth/2 - 120}" y1="${textHeight - 18}" x2="${qrWidth/2 - 10}" y2="${textHeight - 18}" stroke="url(#${gradientId})" stroke-width="1.5"/>
      <line x1="${qrWidth/2 + 10}" y1="${textHeight - 18}" x2="${qrWidth/2 + 120}" y2="${textHeight - 18}" stroke="url(#${gradientId})" stroke-width="1.5"/>
      <rect x="${qrWidth/2 - 6}" y="${textHeight - 24}" width="12" height="12" transform="rotate(45 ${qrWidth/2} ${textHeight - 18})" fill="none" stroke="url(#${gradientId})" stroke-width="1.5"/>
      <circle cx="${qrWidth/2}" cy="${textHeight - 18}" r="3" fill="url(#${gradientId})"/>

      <!-- Subtle top shine line -->
      <line x1="80" y1="15" x2="${qrWidth-80}" y2="15" stroke="url(#${gradientId})" stroke-width="0.5" opacity="0.3"/>
    `;
  } else if (decorative === 'frame') {
    // Elegant frame with accent color border
    decorativeElement = `
      <rect x="15" y="12" width="${qrWidth - 30}" height="${textHeight - 24}" 
            fill="none" stroke="${color}" stroke-width="2" rx="3" opacity="0.4"/>
      <rect x="20" y="17" width="${qrWidth - 40}" height="${textHeight - 34}" 
            fill="none" stroke="${color}" stroke-width="0.5" rx="2" opacity="0.2"/>
      
      <!-- Corner diamonds -->
      <rect x="12" y="9" width="8" height="8" transform="rotate(45 16 13)" fill="${color}" opacity="0.3"/>
      <rect x="${qrWidth - 20}" y="9" width="8" height="8" transform="rotate(45 ${qrWidth-16} 13)" fill="${color}" opacity="0.3"/>
    `;
  }

  const textSvg = Buffer.from(
    `<svg width="${qrWidth}" height="${textHeight}" xmlns="http://www.w3.org/2000/svg">
      ${defs}
      <rect x="0" y="0" width="${qrWidth}" height="${textHeight}" ${bgFill}/>
      ${decorativeElement}
      
      <text 
        x="50%" 
        y="${decorative === 'artDeco' ? '45%' : '50%'}" 
        font-family="Georgia, 'Times New Roman', serif" 
        font-size="${fontSize}" 
        font-weight="${fontWeight}"
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="middle"
        letter-spacing="${letterSpacing}"
        filter="${decorative === 'artDeco' ? 'url(#metalShadow)' : ''}">
        ${restaurantName.toUpperCase()}
      </text>
    </svg>`
  );

  return await qrImage
    .extend({
      top: textHeight,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
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
 * Add "Powered by QR Menu" branding at bottom
 * @param {Buffer} imageBuffer - Image buffer
 * @param {object} style - Branding styling options
 * @returns {Promise<Buffer>} Image with branding
 */
const addBranding = async (imageBuffer, style = {}) => {
  const {
    fontSize = 14,
    color = '#666666',
    padding = 15,
    darkMode = false
  } = style;

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  const brandingHeight = fontSize + (padding * 2.5);
  const bgColor = darkMode ? '#0F172A' : '#fafafa';
  const borderTopColor = darkMode ? '#ffffff15' : '#e0e0e0';
  const textFillColor = darkMode ? '#94A3B8' : color;

  const brandingSvg = Buffer.from(
    `<svg width="${width}" height="${brandingHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect x="0" y="0" width="${width}" height="${brandingHeight}" fill="${bgColor}"/>
      <line x1="0" y1="0" x2="${width}" y2="0" stroke="${borderTopColor}" stroke-width="1"/>
      
      <!-- QR icon -->
      <g transform="translate(${width - 175}, ${brandingHeight / 2 - 6})">
        <rect x="0" y="0" width="3" height="3" fill="${textFillColor}" opacity="0.4"/>
        <rect x="5" y="0" width="3" height="3" fill="${textFillColor}" opacity="0.4"/>
        <rect x="0" y="5" width="3" height="3" fill="${textFillColor}" opacity="0.4"/>
        <rect x="5" y="5" width="3" height="3" fill="${textFillColor}" opacity="0.4"/>
      </g>
      
      <text 
        x="${width - padding - 10}" 
        y="${brandingHeight / 2}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${fontSize}" 
        fill="${textFillColor}" 
        text-anchor="end" 
        dominant-baseline="middle">
        Powered by <tspan fill="url(#brandGrad)" font-weight="bold">QR Menu</tspan>
      </text>
    </svg>`
  );

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
    designSpec
  } = options;

  const { generateCustomizedQR } = require('./qrService');

  // Determine QR colors - respect design override if present, else use template
  let qrColorToUse = template.qrColor;
  let bgColorToUse = template.backgroundColor;
  let borderColorToUse = template.borderColor;

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

  // Step 2: Add restaurant name header
  const layoutStyle = (designSpec && designSpec.layout) ? designSpec.layout.style : 'standard';

  if (restaurantName && designSpec) {
    const headerStyle = designSpec.header;
    qrBuffer = await addRestaurantName(qrBuffer, restaurantName, {
      fontSize: headerStyle.fontSize || 42,
      fontWeight: headerStyle.fontWeight || 'bold',
      letterSpacing: headerStyle.letterSpacing || 2,
      color: headerStyle.color || template.qrColor,
      backgroundColor: layoutStyle === 'luxury' ? '#0F172A' : template.backgroundColor,
      padding: (designSpec.layout && designSpec.layout.padding) || 25,
      decorative: headerStyle.decorative || 'none',
      gradient: headerStyle.gradient,
      gradientColors: headerStyle.gradientColors
    });
  } else if (restaurantName) {
    qrBuffer = await addRestaurantName(qrBuffer, restaurantName, {
      fontSize: 42,
      fontWeight: 'bold',
      color: template.qrColor,
      backgroundColor: template.backgroundColor,
      padding: 25
    });
  }

  // Step 3: Add branding
  const isDarkDesign = layoutStyle === 'luxury';
  if (designSpec && designSpec.branding) {
    qrBuffer = await addBranding(qrBuffer, {
      fontSize: designSpec.branding.size === 'medium' ? 14 : 12,
      color: isDarkDesign ? '#94A3B8' : '#666666',
      padding: 12,
      darkMode: isDarkDesign
    });
  } else {
    qrBuffer = await addBranding(qrBuffer, { fontSize: 12, color: '#999999', padding: 12 });
  }

  // Step 4: Add outer decorative frame
  const image = sharp(qrBuffer);
  const metadata = await image.metadata();
  const framePadding = designSpec && designSpec.layout ? designSpec.layout.padding : 25;

  const borderColor = borderColorToUse;
  const r = parseInt(borderColor.slice(1, 3), 16);
  const g = parseInt(borderColor.slice(3, 5), 16);
  const b = parseInt(borderColor.slice(5, 7), 16);

  const outerFrameWidth = metadata.width + (framePadding * 2);
  const outerFrameHeight = metadata.height + (framePadding * 2);

  let frameSVGContent = '';

  if (layoutStyle === 'luxury') {
    // === LUXURY ART DECO FRAME ===
    let gradientId = 'frameGrad';
    let gradientStops = '';
    
    if (designSpec.header && designSpec.header.gradient === 'custom' && designSpec.header.gradientColors) {
      const gc = designSpec.header.gradientColors;
      gradientStops = `
        <stop offset="0%" style="stop-color:${gc.start};stop-opacity:1" />
        <stop offset="50%" style="stop-color:${gc.mid};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${gc.end};stop-opacity:1" />
      `;
    } else {
      // Gold default
      gradientStops = `
        <stop offset="0%" style="stop-color:#BF953F;stop-opacity:1" />
        <stop offset="25%" style="stop-color:#FCF6BA;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#B38728;stop-opacity:1" />
        <stop offset="75%" style="stop-color:#FBF5B7;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#AA771C;stop-opacity:1" />
      `;
    }

    const frameBgColor = (designSpec.layout && designSpec.layout.frameColor) || '#0F172A';

    frameSVGContent = `
    <defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        ${gradientStops}
      </linearGradient>
      <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0" />
        <stop offset="50%" style="stop-color:#ffffff;stop-opacity:0.05" />
        <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
      </linearGradient>
    </defs>
    
    <!-- Dark Background -->
    <rect x="0" y="0" width="${outerFrameWidth}" height="${outerFrameHeight}" fill="${frameBgColor}"/>
    <!-- Subtle shimmer -->
    <rect x="0" y="0" width="${outerFrameWidth}" height="${outerFrameHeight}" fill="url(#shimmer)"/>
    
    <!-- Triple Border System -->
    <rect x="4" y="4" width="${outerFrameWidth-8}" height="${outerFrameHeight-8}" fill="none" stroke="url(#${gradientId})" stroke-width="4"/>
    <rect x="12" y="12" width="${outerFrameWidth-24}" height="${outerFrameHeight-24}" fill="none" stroke="url(#${gradientId})" stroke-width="1" opacity="0.6"/>
    <rect x="${framePadding - 4}" y="${framePadding - 4}" width="${metadata.width + 8}" height="${metadata.height + 8}" fill="none" stroke="url(#${gradientId})" stroke-width="1.5"/>
    
    <!-- Bold Geometric Corners -->
    <path d="M 4 55 L 4 4 L 55 4" stroke="url(#${gradientId})" stroke-width="7" fill="none"/>
    <path d="M ${outerFrameWidth-4} 55 L ${outerFrameWidth-4} 4 L ${outerFrameWidth-55} 4" stroke="url(#${gradientId})" stroke-width="7" fill="none"/>
    <path d="M 4 ${outerFrameHeight-55} L 4 ${outerFrameHeight-4} L 55 ${outerFrameHeight-4}" stroke="url(#${gradientId})" stroke-width="7" fill="none"/>
    <path d="M ${outerFrameWidth-4} ${outerFrameHeight-55} L ${outerFrameWidth-4} ${outerFrameHeight-4} L ${outerFrameWidth-55} ${outerFrameHeight-4}" stroke="url(#${gradientId})" stroke-width="7" fill="none"/>
    
    <!-- Corner Accent Rays -->
    <line x1="0" y1="0" x2="35" y2="35" stroke="url(#${gradientId})" stroke-width="1.5" opacity="0.6"/>
    <line x1="${outerFrameWidth}" y1="0" x2="${outerFrameWidth-35}" y2="35" stroke="url(#${gradientId})" stroke-width="1.5" opacity="0.6"/>
    <line x1="0" y1="${outerFrameHeight}" x2="35" y2="${outerFrameHeight-35}" stroke="url(#${gradientId})" stroke-width="1.5" opacity="0.6"/>
    <line x1="${outerFrameWidth}" y1="${outerFrameHeight}" x2="${outerFrameWidth-35}" y2="${outerFrameHeight-35}" stroke="url(#${gradientId})" stroke-width="1.5" opacity="0.6"/>
    
    <!-- Side Ornamental Lines -->
    <line x1="18" y1="${outerFrameHeight * 0.25}" x2="18" y2="${outerFrameHeight * 0.75}" stroke="url(#${gradientId})" stroke-width="0.5" opacity="0.3"/>
    <line x1="${outerFrameWidth - 18}" y1="${outerFrameHeight * 0.25}" x2="${outerFrameWidth - 18}" y2="${outerFrameHeight * 0.75}" stroke="url(#${gradientId})" stroke-width="0.5" opacity="0.3"/>
    `;

  } else if (layoutStyle === 'classic') {
    // === CLASSIC ELEGANT FRAME ===
    // Rich colored border with double-line elegance and accent corners
    const frameColor = (designSpec && designSpec.layout && designSpec.layout.frameColor) || `rgb(${r},${g},${b})`;
    
    frameSVGContent = `
      <defs>
        <linearGradient id="classicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(${r},${g},${b});stop-opacity:1" />
          <stop offset="50%" style="stop-color:rgb(${Math.min(r+40,255)},${Math.min(g+40,255)},${Math.min(b+40,255)});stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(${r},${g},${b});stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Colored background -->
      <rect x="0" y="0" width="${outerFrameWidth}" height="${outerFrameHeight}" fill="${frameColor}"/>
      
      <!-- Inner gradient overlay -->
      <rect x="0" y="0" width="${outerFrameWidth}" height="${outerFrameHeight}" fill="url(#classicGrad)" opacity="0.15"/>
      
      <!-- Elegant double border -->
      <rect x="5" y="5" width="${outerFrameWidth-10}" height="${outerFrameHeight-10}" 
            fill="none" stroke="#ffffff" stroke-width="2" opacity="0.5"/>
      <rect x="10" y="10" width="${outerFrameWidth-20}" height="${outerFrameHeight-20}" 
            fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.3"/>
      
      <!-- Thick corner L-brackets -->
      <line x1="5" y1="5" x2="40" y2="5" stroke="#ffffff" stroke-width="4" opacity="0.8"/>
      <line x1="5" y1="5" x2="5" y2="40" stroke="#ffffff" stroke-width="4" opacity="0.8"/>
      
      <line x1="${outerFrameWidth-5}" y1="5" x2="${outerFrameWidth-40}" y2="5" stroke="#ffffff" stroke-width="4" opacity="0.8"/>
      <line x1="${outerFrameWidth-5}" y1="5" x2="${outerFrameWidth-5}" y2="40" stroke="#ffffff" stroke-width="4" opacity="0.8"/>
      
      <line x1="5" y1="${outerFrameHeight-5}" x2="40" y2="${outerFrameHeight-5}" stroke="#ffffff" stroke-width="4" opacity="0.8"/>
      <line x1="5" y1="${outerFrameHeight-5}" x2="5" y2="${outerFrameHeight-40}" stroke="#ffffff" stroke-width="4" opacity="0.8"/>
      
      <line x1="${outerFrameWidth-5}" y1="${outerFrameHeight-5}" x2="${outerFrameWidth-40}" y2="${outerFrameHeight-5}" stroke="#ffffff" stroke-width="4" opacity="0.8"/>
      <line x1="${outerFrameWidth-5}" y1="${outerFrameHeight-5}" x2="${outerFrameWidth-5}" y2="${outerFrameHeight-40}" stroke="#ffffff" stroke-width="4" opacity="0.8"/>
      
      <!-- Corner diamonds -->
      <rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" fill="#ffffff" opacity="0.6"/>
      <rect x="${outerFrameWidth-10}" y="2" width="8" height="8" transform="rotate(45 ${outerFrameWidth-6} 6)" fill="#ffffff" opacity="0.6"/>
      <rect x="2" y="${outerFrameHeight-10}" width="8" height="8" transform="rotate(45 6 ${outerFrameHeight-6})" fill="#ffffff" opacity="0.6"/>
      <rect x="${outerFrameWidth-10}" y="${outerFrameHeight-10}" width="8" height="8" transform="rotate(45 ${outerFrameWidth-6} ${outerFrameHeight-6})" fill="#ffffff" opacity="0.6"/>
      
      <!-- Side accents -->
      <line x1="${outerFrameWidth*0.25}" y1="8" x2="${outerFrameWidth*0.75}" y2="8" stroke="#ffffff" stroke-width="1" opacity="0.25"/>
      <line x1="${outerFrameWidth*0.25}" y1="${outerFrameHeight-8}" x2="${outerFrameWidth*0.75}" y2="${outerFrameHeight-8}" stroke="#ffffff" stroke-width="1" opacity="0.25"/>
    `;

  } else if (layoutStyle === 'modern') {
    // === MODERN MINIMAL FRAME ===
    // Clean white frame with thin accent border lines
    const accentColor = (designSpec && designSpec.layout && designSpec.layout.frameColor) || `rgb(${r},${g},${b})`;
    
    frameSVGContent = `
      <!-- Clean white background -->
      <rect x="0" y="0" width="${outerFrameWidth}" height="${outerFrameHeight}" fill="#FFFFFF"/>
      
      <!-- Clean outer accent border -->
      <rect x="2" y="2" width="${outerFrameWidth-4}" height="${outerFrameHeight-4}" 
            fill="none" stroke="${accentColor}" stroke-width="3" rx="6"/>
      
      <!-- Thin inner hairline -->
      <rect x="8" y="8" width="${outerFrameWidth-16}" height="${outerFrameHeight-16}" 
            fill="none" stroke="${accentColor}" stroke-width="0.5" rx="3" opacity="0.3"/>
      
      <!-- Subtle accent corners -->
      <circle cx="8" cy="8" r="3" fill="${accentColor}" opacity="0.4"/>
      <circle cx="${outerFrameWidth-8}" cy="8" r="3" fill="${accentColor}" opacity="0.4"/>
      <circle cx="8" cy="${outerFrameHeight-8}" r="3" fill="${accentColor}" opacity="0.4"/>
      <circle cx="${outerFrameWidth-8}" cy="${outerFrameHeight-8}" r="3" fill="${accentColor}" opacity="0.4"/>

      <!-- Top center accent dash -->
      <line x1="${outerFrameWidth/2 - 30}" y1="2" x2="${outerFrameWidth/2 + 30}" y2="2" stroke="${accentColor}" stroke-width="4"/>
      <!-- Bottom center accent dash -->
      <line x1="${outerFrameWidth/2 - 30}" y1="${outerFrameHeight - 2}" x2="${outerFrameWidth/2 + 30}" y2="${outerFrameHeight - 2}" stroke="${accentColor}" stroke-width="4"/>
    `;

  } else {
    // === STANDARD ORNATE FRAME (fallback) ===
    frameSVGContent = `
      <defs>
        <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(${r},${g},${b});stop-opacity:1" />
          <stop offset="50%" style="stop-color:rgb(${Math.min(r+20,255)},${Math.min(g+20,255)},${Math.min(b+20,255)});stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(${r},${g},${b});stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect x="0" y="0" width="${outerFrameWidth}" height="${outerFrameHeight}" fill="rgb(${r},${g},${b})"/>
      
      <g transform="translate(15, 15)">
        <path d="M 0 25 Q 0 0 25 0" stroke="#ffffff40" stroke-width="2" fill="none"/>
        <circle cx="0" cy="25" r="3" fill="#ffffffaa"/>
        <circle cx="25" cy="0" r="3" fill="#ffffffaa"/>
      </g>
      <g transform="translate(${outerFrameWidth - 40}, 15)">
        <path d="M 25 25 Q 25 0 0 0" stroke="#ffffff40" stroke-width="2" fill="none"/>
        <circle cx="25" cy="25" r="3" fill="#ffffffaa"/>
        <circle cx="0" cy="0" r="3" fill="#ffffffaa"/>
      </g>
      <g transform="translate(15, ${outerFrameHeight - 40})">
        <path d="M 0 0 Q 0 25 25 25" stroke="#ffffff40" stroke-width="2" fill="none"/>
        <circle cx="0" cy="0" r="3" fill="#ffffffaa"/>
        <circle cx="25" cy="25" r="3" fill="#ffffffaa"/>
      </g>
      <g transform="translate(${outerFrameWidth - 40}, ${outerFrameHeight - 40})">
        <path d="M 25 0 Q 25 25 0 25" stroke="#ffffff40" stroke-width="2" fill="none"/>
        <circle cx="25" cy="0" r="3" fill="#ffffffaa"/>
        <circle cx="0" cy="25" r="3" fill="#ffffffaa"/>
      </g>
     `;
  }

  const ornateBorderSVG = Buffer.from(
    `<svg width="${outerFrameWidth}" height="${outerFrameHeight}" xmlns="http://www.w3.org/2000/svg">
      ${frameSVGContent}
    </svg>`
  );

  // Composite frame + QR content
  const bgR = layoutStyle === 'luxury' ? 15 : (layoutStyle === 'modern' ? 255 : r);
  const bgG = layoutStyle === 'luxury' ? 23 : (layoutStyle === 'modern' ? 255 : g);
  const bgB = layoutStyle === 'luxury' ? 42 : (layoutStyle === 'modern' ? 255 : b);

  qrBuffer = await sharp({
    create: {
      width: outerFrameWidth,
      height: outerFrameHeight,
      channels: 4,
      background: { r: bgR, g: bgG, b: bgB, alpha: 1 }
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
