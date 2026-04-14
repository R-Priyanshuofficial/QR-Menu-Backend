const VALID_BORDER_STYLES = ['none', 'solid', 'dashed'];

const LEGACY_BORDER_STYLE_MAP = {
  simple: 'solid',
  basic: 'solid',
  default: 'solid',
  square: 'solid',
  rounded: 'solid',
  elegant: 'solid',
  shadow: 'dashed',
  circular: 'dashed',
};

const HEX_COLOR_REGEX = /^#(?:[0-9A-Fa-f]{3}){1,2}$/;

const sanitizeColor = (value, fallback) =>
  typeof value === 'string' && HEX_COLOR_REGEX.test(value.trim()) ? value : fallback;

const sanitizeBorderStyle = (style) => {
  const normalized = typeof style === 'string' ? style.toLowerCase().trim() : '';
  const mapped = LEGACY_BORDER_STYLE_MAP[normalized] || normalized;
  return VALID_BORDER_STYLES.includes(mapped) ? mapped : 'none';
};

const sanitizeCustomization = (customization = {}, type = 'global') => ({
  logoUrl: typeof customization.logoUrl === 'string' ? customization.logoUrl : null,
  borderStyle: sanitizeBorderStyle(customization.borderStyle),
  borderColor: sanitizeColor(customization.borderColor, '#000000'),
  qrColor: sanitizeColor(customization.qrColor, '#000000'),
  backgroundColor: sanitizeColor(customization.backgroundColor, '#FFFFFF'),
  showTableNumber: type === 'table' && customization.showTableNumber === true,
  avatarId: typeof customization.avatarId === 'string' ? customization.avatarId : null,
});

module.exports = {
  VALID_BORDER_STYLES,
  sanitizeBorderStyle,
  sanitizeCustomization,
};
