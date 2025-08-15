/**
 * Parse an input color into a normalized RGBA object.
 * Supported formats:
 *   - #RGB
 *   - #RRGGBB
 *   - #RRGGBBAA
 *   - rgb(r, g, b)
 *   - rgba(r, g, b, a)
 *   - { r, g, b, a }
 *
 * @param {*} val - Input color
 * @param {{r:number,g:number,b:number,a:number}} def - Default RGBA if parsing fails
 * @returns {{r:number,g:number,b:number,a:number}}
 */
export function parseColorToRgba(val, def = { r: 0, g: 0, b: 0, a: 1 }) {
  if (!val) return def;

  // Hex (#RGB, #RRGGBB, #RRGGBBAA)
  if (typeof val === 'string' && val.startsWith('#')) {
    let hex = val.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length === 6) hex += 'FF';

    if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      if ([r, g, b].every(x => !isNaN(x)) && !isNaN(a)) {
        return { r, g, b, a };
      }
    }
  }

  // rgb() / rgba()
  if (typeof val === 'string') {
    const m = val.match(
      /^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)$/i
    );
    if (m) {
      const r = Math.min(255, parseInt(m[1], 10));
      const g = Math.min(255, parseInt(m[2], 10));
      const b = Math.min(255, parseInt(m[3], 10));
      const a = m[4] !== undefined ? Math.min(1, parseFloat(m[4])) : 1;
      return { r, g, b, a };
    }
  }

  // Object { r, g, b, a }
  if (
    typeof val === 'object' &&
    val !== null &&
    'r' in val &&
    'g' in val &&
    'b' in val
  ) {
    const r = Math.min(255, Number(val.r) || 0);
    const g = Math.min(255, Number(val.g) || 0);
    const b = Math.min(255, Number(val.b) || 0);
    const a =
      val.a !== undefined ? Math.min(1, Number(val.a) || 0) : 1;
    return { r, g, b, a };
  }

  return def;
}

/**
 * Convert RGBA object to CSS rgba() string.
 * @param {{r:number,g:number,b:number,a:number}} rgba
 * @returns {string}
 */
export function rgbaToCss({ r, g, b, a }) {
  return `rgba(${r},${g},${b},${a})`;
}


/**
 * Parse a string containing a list of colors into an array.
 * Supports rgba(...) strings and plain comma-separated elements.
 * Preserves order and invalid entries as-is.
 *
 * Example:
 *   "asdasd, rgba(1,1,1,1), #ff00ff" 
 *   → ["asdasd", "rgba(1,1,1,1)", "#ff00ff"]
 *
 * @param {string|string[]} val - Input string or array
 * @returns {string[]} Array of elements
 */
export function parseColorArray(val) {
  if (!val) return [];

  if (Array.isArray(val)) return val.slice();

  if (typeof val !== 'string') return [];

  const regex = /(rgba?\([^)]+\))/gi;
  const result = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(val)) !== null) {
    // Push anything before this match, split by comma
    const prefix = val
      .slice(lastIndex, match.index)
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
    result.push(...prefix);

    // Push matched rgba string
    result.push(match[0]);
    lastIndex = regex.lastIndex;
  }

  // Push remaining items after last match
  const suffix = val
    .slice(lastIndex)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  result.push(...suffix);

  return result;
}

