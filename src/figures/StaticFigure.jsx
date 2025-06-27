import React from 'react';
import SettingTypes from '../enums/SettingTypes';

export default class StaticFigure extends React.Component {
  static displayName = 'Static Figure';
  static name = 'StaticFigure';
  constructor(props) {
    super(props);
    this.id = props.id || `figure_${Math.random().toString(36).slice(2, 11)}`;
    this.title = props.title || 'Untitled Figure';

    this.settings = this.applySchema(props.settings || {});
  }

  static get settingSchema() {
    return {
      // No default schema for StaticFigure
    };
  }

  applySchema(settings) {
    const schema = this.constructor.settingSchema || {};
    const applied = {};

    for (const key in schema) {
      const { type, default: def } = schema[key];
      let val = settings[key];
      if (val === undefined) val = def;

      switch (type) {
        case SettingTypes.NUMBER:
          val = Number(val);
          if (isNaN(val)) val = def;
          break;
        case SettingTypes.INT:
          val = parseInt(val);
          if (isNaN(val)) val = def;
          break;
        case SettingTypes.BOOLEAN:
          val = typeof val === 'string' ? val.toLowerCase() === 'true' : Boolean(val);
          break;
        case SettingTypes.STRING:
          val = String(val);
          break;
        case SettingTypes.ARRAY:
          val = Array.isArray(val) ? val : def || [];
          break;
        case SettingTypes.OBJECT:
          val = val && typeof val === 'object' && !Array.isArray(val) ? val : def || {};
          break;
        default:
          break;
      }

      applied[key] = val;
    }

    return applied;
  }

  componentDidUpdate(prevProps) {
    //const prevSettings = prevProps.settings || {};
    const newSettings = this.props.settings || {};
    const schema = this.constructor.settingSchema || {};

    const appliedSettings = this.applySchema(newSettings);
    const correctedSettings = { ...newSettings };
    let hasCorrection = false;

    for (const key in schema) {
      const appliedVal = appliedSettings[key];
      const rawVal = newSettings[key];

      if (rawVal !== appliedVal) {
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
    return <div>StaticFigure base class (override render!)</div>;
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
