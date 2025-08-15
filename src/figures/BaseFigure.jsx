import React from 'react';
import SettingTypes from '../enums/SettingTypes.js';
import { parseColorToRgba, rgbaToCss, parseColorArray } from '../utils/colors';

export default class BaseFigure extends React.Component {
  static displayName = 'Base Figure';
  static name = 'BaseFigure';

  constructor(props) {
    super(props);
    this.id = props.id || `figure_${Math.random().toString(36).slice(2, 11)}`;
    this.title = props.title || 'Untitled Figure';
    this.settings = this.applySchema(props.settings || {});
  }

  static get settingSchema() {
    return {
      // Subclasses define their schema here
    };
  }

  /** Centralized coercion logic - strict validation with defaults */
  static coerceValue(val, type, meta = {}) {
    switch (type) {
      case SettingTypes.NUMBER:
        val = Number(val);
        return isNaN(val) ? meta.default : val;

      case SettingTypes.INT:
        val = parseInt(val, 10);
        return isNaN(val) ? meta.default : val;

      case SettingTypes.BOOLEAN:
        return typeof val === 'string'
          ? val.toLowerCase() === 'true'
          : Boolean(val);

      case SettingTypes.STRING:
        return String(val);

      case SettingTypes.ARRAY: {
        if (typeof val === 'string' && meta.elementType === SettingTypes.COLOR) {
          // Use new parseColorArray function for robust parsing
          val = parseColorArray(val);
        } else if (typeof val === 'string') {
          val = val.split(',').map(v => v.trim()).filter(Boolean);
        }

        val = Array.isArray(val) ? val.slice() : meta.default || [];

        if (meta.elementType) {
          const coercedElements = [];
          let hasInvalidElement = false;

          for (const element of val) {
            if (element == null || element === '') {
              hasInvalidElement = true;
              break;
            }

            const coerced = BaseFigure.coerceValue(element, meta.elementType, meta.elementMeta || {});

            if (meta.elementType === SettingTypes.NUMBER || meta.elementType === SettingTypes.INT) {
              if (isNaN(Number(element)) && coerced === (meta.elementMeta?.default || 0)) {
                hasInvalidElement = true;
                break;
              }
            } else if (meta.elementType === SettingTypes.COLOR) {
              try {
                const testRgba = parseColorToRgba(element, null);
                if (!testRgba) {
                  hasInvalidElement = true;
                  break;
                }
              } catch {
                hasInvalidElement = true;
                break;
              }
            }

            coercedElements.push(coerced);
          }

          if (hasInvalidElement) {
            return meta.default || [];
          }

          val = coercedElements;
        }

        return val;
      }

      case SettingTypes.OBJECT:
        return val && typeof val === 'object' && !Array.isArray(val)
          ? val
          : meta.default || {};

      case SettingTypes.COLOR: {
        try {
          const rgba = parseColorToRgba(val, null);
          if (!rgba) return meta.default || 'rgba(0,0,0,1)';
          return rgbaToCss(rgba);
        } catch {
          return meta.default || 'rgba(0,0,0,1)';
        }
      }

      default:
        return val;
    }
  }

  /** Type-aware equality check - FIXED to compare raw vs coerced */
  static isEqual(raw, coerced, type, meta = {}) {
    if (raw === coerced) return true;
    if (raw == null && coerced == null) return true;
    if (raw == null || coerced == null) return false;

    if (type === SettingTypes.ARRAY && typeof raw === 'string' && meta.elementType === SettingTypes.COLOR) {
      const parsedRaw = parseColorArray(raw);
      if (!Array.isArray(coerced) || parsedRaw.length !== coerced.length) return false;
      return parsedRaw.every((v, i) => BaseFigure.isEqual(v, coerced[i], meta.elementType, meta.elementMeta || {}));
    }

    if (type === SettingTypes.ARRAY) {
      if (!Array.isArray(raw) || !Array.isArray(coerced) || raw.length !== coerced.length) return false;
      return raw.every((v, i) => BaseFigure.isEqual(v, coerced[i], meta.elementType, meta.elementMeta || {}));
    }

    if (type === SettingTypes.OBJECT) {
      if (raw === coerced) return true;
      if (!raw || !coerced) return false;
      const rawKeys = Object.keys(raw);
      const coercedKeys = Object.keys(coerced);
      if (rawKeys.length !== coercedKeys.length) return false;
      return rawKeys.every(k =>
        BaseFigure.isEqual(raw[k], coerced[k], meta.properties?.[k]?.type, meta.properties?.[k] || {})
      );
    }

    if (type === SettingTypes.NUMBER || type === SettingTypes.INT) {
      const rawNum = Number(raw);
      const coercedNum = Number(coerced);
      if (isNaN(rawNum) && isNaN(coercedNum)) return true;
      return rawNum === coercedNum;
    }

    if (type === SettingTypes.BOOLEAN) {
      return Boolean(raw) === Boolean(coerced);
    }

    if (type === SettingTypes.COLOR || type === SettingTypes.STRING) {
      return String(raw) === String(coerced);
    }

    return raw === coerced;
  }

  /** Apply schema defaults and coercion */
  applySchema(settings) {
    const schema = this.constructor.settingSchema || {};
    const applied = {};
    for (const key in schema) {
      const meta = schema[key];
      const raw = settings[key] !== undefined ? settings[key] : meta.default;
      applied[key] = this.constructor.coerceValue(raw, meta.type, meta);
    }
    return applied;
  }

  componentDidUpdate(prevProps) {
    const newSettings = this.props.settings || {};
    const schema = this.constructor.settingSchema || {};
    const appliedSettings = this.applySchema(newSettings);
    const correctedSettings = { ...newSettings };
    let hasCorrection = false;

    for (const key in schema) {
      const appliedVal = appliedSettings[key];
      const rawVal = newSettings[key];
      const meta = schema[key];
      const type = meta.type;

      if (!BaseFigure.isEqual(rawVal, appliedVal, type, meta)) {
        console.warn(`[${this.id}] Corrected setting '${key}':`, rawVal, '→', appliedVal);
        correctedSettings[key] = appliedVal;
        hasCorrection = true;
      }
    }

    this.settings = appliedSettings;

    if (hasCorrection && typeof this.props.onSettingsCorrected === 'function') {
      this.props.onSettingsCorrected(correctedSettings);
    }
  }

  render() {
    return <div>BaseFigure base class (override render!)</div>;
  }

  toJSON() {
    return {
      type: this.constructor.figureName || this.constructor.name,
      id: this.id,
      title: this.title,
      settings: this.settings,
    };
  }
}
