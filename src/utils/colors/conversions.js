/**
 * Convert RGBA object to hex string (#RRGGBB or #RRGGBBAA if alpha < 1)
 */
export function rgbaToHex({ r, g, b, a = 1 }) {
  const toHex = v => v.toString(16).padStart(2, '0');
  const rgbHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  if (a < 1) {
    return `${rgbHex}${toHex(Math.round(a * 255))}`;
  }
  return rgbHex;
}

/**
 * Convert hex string (#RGB, #RRGGBB, #RRGGBBAA) to RGBA object
 */
export function hexToRgba(hex) {
  if (typeof hex !== 'string' || !hex.startsWith('#')) return null;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length === 6) h += 'FF';
  if (h.length !== 8) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: parseInt(h.slice(6, 8), 16) / 255
  };
}

/**
 * Convert RGB to HSL
 * r, g, b in [0, 255]
 * returns { h: [0, 360), s: [0, 1], l: [0, 1] }
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        h = 0; // fallback if max is none of r, g, b
    }
    h *= 60;
  }

  return { h, s, l };
}

/**
 * Convert HSL to RGB
 * h in [0, 360), s, l in [0, 1]
 * returns { r: [0, 255], g: [0, 255], b: [0, 255] }
 */
export function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    h /= 360;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}
