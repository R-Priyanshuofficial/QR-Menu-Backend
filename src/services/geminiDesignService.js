/**
 * Gemini Design Service
 * Generates template-specific design specifications for QR code placeholders
 * Each template gets 3 visually DISTINCT designs that clearly show the template's colors
 */

const generateDesignVariations = async (restaurantName, templateId = 'royal') => {
  return null; // SVG fallback only — AI image gen needs a non-leaked key
};

/**
 * Template-specific design variations
 * CRITICAL: Design-1 must use the template's IDENTITY color prominently
 * Design-2 uses a dark luxury frame, Design-3 uses clean modern
 */
const getDefaultDesigns = (template) => {
  const templateId = template.id || 'royal';

  const designFactories = {
    // ═══════════════════════════════════════════════════════════════
    // ROYAL — Purple & Gold
    // ═══════════════════════════════════════════════════════════════
    royal: () => [
      {
        id: 'design-1',
        name: 'Royal Heritage',
        description: 'Rich purple frame with gold corner accents',
        header: { fontSize: 48, fontWeight: 'bold', letterSpacing: 3, textAlign: 'center', decorative: 'frame', color: '#FFD700', gradient: null },
        layout: { padding: 35, qrSize: 'normal', style: 'classic', frameColor: '#4A148C' },
        qrOverride: null,
        branding: { position: 'bottom-right', size: 'small', style: 'subtle' },
        theme: 'royal'
      },
      {
        id: 'design-2',
        name: 'Royal Opulence',
        description: 'Dark velvet with metallic gold Art Deco borders',
        header: { fontSize: 52, fontWeight: 'bold', letterSpacing: 4, textAlign: 'center', decorative: 'artDeco', color: '#FFD700', gradient: 'gold' },
        layout: { padding: 45, qrSize: 'normal', style: 'luxury', frameColor: '#1A0A3E' },
        qrOverride: { qrColor: '#2D1B69', backgroundColor: '#F3E5F5', borderColor: '#1A0A3E' },
        branding: { position: 'bottom-center', size: 'medium', style: 'prominent' },
        theme: 'royal'
      },
      {
        id: 'design-3',
        name: 'Royal Modern',
        description: 'Clean white design with purple accent borders',
        header: { fontSize: 42, fontWeight: 'normal', letterSpacing: 6, textAlign: 'center', decorative: 'none', color: '#4A148C', gradient: null },
        layout: { padding: 22, qrSize: 'normal', style: 'modern', frameColor: '#9C27B0' },
        qrOverride: null,
        branding: { position: 'bottom-right', size: 'small', style: 'subtle' },
        theme: 'royal'
      }
    ],

    // ═══════════════════════════════════════════════════════════════
    // CLASSY — Black, White & Gold
    // ═══════════════════════════════════════════════════════════════
    classy: () => [
      {
        id: 'design-1',
        name: 'Classic Elegance',
        description: 'Champagne gold frame with cream interior',
        header: { fontSize: 48, fontWeight: 'bold', letterSpacing: 3, textAlign: 'center', decorative: 'frame', color: '#1A1A1A', gradient: null },
        layout: { padding: 35, qrSize: 'normal', style: 'classic', frameColor: '#D4AF37' },
        qrOverride: null,
        branding: { position: 'bottom-right', size: 'small', style: 'subtle' },
        theme: 'classy'
      },
      {
        id: 'design-2',
        name: 'Noir Sophistication',
        description: 'Matte black with champagne gold Art Deco',
        header: { fontSize: 52, fontWeight: 'bold', letterSpacing: 4, textAlign: 'center', decorative: 'artDeco', color: '#D4AF37', gradient: 'gold' },
        layout: { padding: 45, qrSize: 'normal', style: 'luxury', frameColor: '#0A0A0A' },
        qrOverride: { qrColor: '#1A1A1A', backgroundColor: '#FFF8E7', borderColor: '#0A0A0A' },
        branding: { position: 'bottom-center', size: 'medium', style: 'prominent' },
        theme: 'classy'
      },
      {
        id: 'design-3',
        name: 'Metropolitan',
        description: 'Clean white with thin black hairline borders',
        header: { fontSize: 42, fontWeight: 'normal', letterSpacing: 6, textAlign: 'center', decorative: 'none', color: '#1A1A1A', gradient: null },
        layout: { padding: 22, qrSize: 'normal', style: 'modern', frameColor: '#1A1A1A' },
        qrOverride: null,
        branding: { position: 'bottom-right', size: 'small', style: 'subtle' },
        theme: 'classy'
      }
    ],

    // ═══════════════════════════════════════════════════════════════
    // FRESH — Green & White  
    // ═══════════════════════════════════════════════════════════════
    fresh: () => [
      {
        id: 'design-1',
        name: 'Garden Botanical',
        description: 'Rich green frame with white corner accents',
        header: { fontSize: 48, fontWeight: 'bold', letterSpacing: 3, textAlign: 'center', decorative: 'frame', color: '#FFFFFF', gradient: null },
        layout: { padding: 35, qrSize: 'normal', style: 'classic', frameColor: '#2E7D32' },
        qrOverride: null,
        branding: { position: 'bottom-right', size: 'small', style: 'subtle' },
        theme: 'fresh'
      },
      {
        id: 'design-2',
        name: 'Emerald Luxury',
        description: 'Deep emerald with golden leaf Art Deco accents',
        header: { fontSize: 52, fontWeight: 'bold', letterSpacing: 4, textAlign: 'center', decorative: 'artDeco', color: '#DAA520', gradient: 'gold' },
        layout: { padding: 45, qrSize: 'normal', style: 'luxury', frameColor: '#0D2818' },
        qrOverride: { qrColor: '#1B5E20', backgroundColor: '#E8F5E9', borderColor: '#0D2818' },
        branding: { position: 'bottom-center', size: 'medium', style: 'prominent' },
        theme: 'fresh'
      },
      {
        id: 'design-3',
        name: 'Fresh Modern',
        description: 'Clean white design with green accent lines',
        header: { fontSize: 42, fontWeight: 'normal', letterSpacing: 6, textAlign: 'center', decorative: 'none', color: '#1B5E20', gradient: null },
        layout: { padding: 22, qrSize: 'normal', style: 'modern', frameColor: '#4CAF50' },
        qrOverride: null,
        branding: { position: 'bottom-right', size: 'small', style: 'subtle' },
        theme: 'fresh'
      }
    ],

    // ═══════════════════════════════════════════════════════════════
    // VIBRANT — Red & Orange
    // ═══════════════════════════════════════════════════════════════
    vibrant: () => [
      {
        id: 'design-1',
        name: 'Crimson Fire',
        description: 'Bold red frame with warm orange accents',
        header: { fontSize: 48, fontWeight: 'bold', letterSpacing: 3, textAlign: 'center', decorative: 'frame', color: '#FFFFFF', gradient: null },
        layout: { padding: 35, qrSize: 'normal', style: 'classic', frameColor: '#D32F2F' },
        qrOverride: null,
        branding: { position: 'bottom-right', size: 'small', style: 'subtle' },
        theme: 'vibrant'
      },
      {
        id: 'design-2',
        name: 'Ruby Premium',
        description: 'Dark background with copper-gold Art Deco accents',
        header: { fontSize: 52, fontWeight: 'bold', letterSpacing: 4, textAlign: 'center', decorative: 'artDeco', color: '#FFB74D', gradient: 'roseGold' },
        layout: { padding: 45, qrSize: 'normal', style: 'luxury', frameColor: '#1A0505' },
        qrOverride: { qrColor: '#B71C1C', backgroundColor: '#FFF3E0', borderColor: '#1A0505' },
        branding: { position: 'bottom-center', size: 'medium', style: 'prominent' },
        theme: 'vibrant'
      },
      {
        id: 'design-3',
        name: 'Sunset Modern',
        description: 'Clean white design with bold red accent borders',
        header: { fontSize: 42, fontWeight: 'normal', letterSpacing: 6, textAlign: 'center', decorative: 'none', color: '#B71C1C', gradient: null },
        layout: { padding: 22, qrSize: 'normal', style: 'modern', frameColor: '#FF5722' },
        qrOverride: null,
        branding: { position: 'bottom-right', size: 'small', style: 'subtle' },
        theme: 'vibrant'
      }
    ],

    // ═══════════════════════════════════════════════════════════════
    // OCEAN — Blue & Teal
    // ═══════════════════════════════════════════════════════════════
    ocean: () => [
      {
        id: 'design-1',
        name: 'Coastal Elegance',
        description: 'Ocean blue frame with teal corner accents',
        header: { fontSize: 48, fontWeight: 'bold', letterSpacing: 3, textAlign: 'center', decorative: 'frame', color: '#FFFFFF', gradient: null },
        layout: { padding: 35, qrSize: 'normal', style: 'classic', frameColor: '#0277BD' },
        qrOverride: null,
        branding: { position: 'bottom-right', size: 'small', style: 'subtle' },
        theme: 'ocean'
      },
      {
        id: 'design-2',
        name: 'Deep Sea',
        description: 'Dark ocean blue with silver-pearl Art Deco borders',
        header: { fontSize: 52, fontWeight: 'bold', letterSpacing: 4, textAlign: 'center', decorative: 'artDeco', color: '#E0F7FA', gradient: 'silver' },
        layout: { padding: 45, qrSize: 'normal', style: 'luxury', frameColor: '#01304A' },
        qrOverride: { qrColor: '#01579B', backgroundColor: '#E1F5FE', borderColor: '#01304A' },
        branding: { position: 'bottom-center', size: 'medium', style: 'prominent' },
        theme: 'ocean'
      },
      {
        id: 'design-3',
        name: 'Aqua Modern',
        description: 'Clean white design with teal accent borders',
        header: { fontSize: 42, fontWeight: 'normal', letterSpacing: 6, textAlign: 'center', decorative: 'none', color: '#01579B', gradient: null },
        layout: { padding: 22, qrSize: 'normal', style: 'modern', frameColor: '#00BCD4' },
        qrOverride: null,
        branding: { position: 'bottom-right', size: 'small', style: 'subtle' },
        theme: 'ocean'
      }
    ],

    // ═══════════════════════════════════════════════════════════════
    // CUSTOM — User's own colors  
    // ═══════════════════════════════════════════════════════════════
    custom: () => [
      {
        id: 'design-1',
        name: 'Custom Classic',
        description: 'Bordered design with your custom colors',
        header: { fontSize: 48, fontWeight: 'bold', letterSpacing: 3, textAlign: 'center', decorative: 'frame', color: template.qrColor || '#000000', gradient: null },
        layout: { padding: 35, qrSize: 'normal', style: 'classic', frameColor: template.borderColor || '#000000' },
        qrOverride: null,
        branding: { position: 'bottom-right', size: 'small', style: 'subtle' },
        theme: 'custom'
      },
      {
        id: 'design-2',
        name: 'Premium Dark',
        description: 'Elegant dark frame with gold Art Deco accents',
        header: { fontSize: 52, fontWeight: 'bold', letterSpacing: 4, textAlign: 'center', decorative: 'artDeco', color: '#D4AF37', gradient: 'gold' },
        layout: { padding: 45, qrSize: 'normal', style: 'luxury', frameColor: '#1A1A1A' },
        qrOverride: { qrColor: template.qrColor || '#000000', backgroundColor: template.backgroundColor || '#FFFFFF', borderColor: '#1A1A1A' },
        branding: { position: 'bottom-center', size: 'medium', style: 'prominent' },
        theme: 'custom'
      },
      {
        id: 'design-3',
        name: 'Clean Modern',
        description: 'Minimalist white design with thin accent lines',
        header: { fontSize: 42, fontWeight: 'normal', letterSpacing: 6, textAlign: 'center', decorative: 'none', color: template.qrColor || '#000000', gradient: null },
        layout: { padding: 22, qrSize: 'normal', style: 'modern', frameColor: template.borderColor || '#000000' },
        qrOverride: null,
        branding: { position: 'bottom-right', size: 'small', style: 'subtle' },
        theme: 'custom'
      }
    ]
  };

  const factory = designFactories[templateId] || designFactories.custom;
  return factory();
};

module.exports = {
  generateDesignVariations,
  getDefaultDesigns
};
