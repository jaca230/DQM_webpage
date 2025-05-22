import React from 'react';
import SettingTypes from '../enums/SettingTypes';

export default class Figure extends React.Component {
  constructor(props) {
    super(props);
    this.id = props.id || `figure_${Math.random().toString(36).slice(2, 11)}`;
    this.title = props.title || 'Untitled Figure';

    this.intervalId = null;
    this.settings = this.applySchema(props.settings || {});
  }

  static get settingSchema() {
    return {
      updateFrequency: {
        type: SettingTypes.NUMBER,
        default: 2,
        onChange: 'onUpdateFrequencyChange',
      },
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

  componentDidMount() {
    this.onInit(); // 🔹 one-time init call
    this.setupInterval(this.settings.updateFrequency);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  componentDidUpdate(prevProps) {
    const prevSettings = prevProps.settings || {};
    const newSettings = this.props.settings || {};
    const schema = this.constructor.settingSchema || {};

    const appliedSettings = this.applySchema(newSettings);
    const correctedSettings = { ...newSettings };
    let hasCorrection = false;

    for (const key in schema) {
      const { default: def } = schema[key];
      const appliedVal = appliedSettings[key];
      const rawVal = newSettings[key];

      // Compare raw vs. sanitized value to detect correction
      if (rawVal !== appliedVal) {
        console.warn(`[${this.id}] Corrected setting '${key}':`, rawVal, '→', appliedVal);
        correctedSettings[key] = appliedVal;
        hasCorrection = true;
      }

      const oldVal = prevSettings[key];
      if (appliedVal !== oldVal) {
        const onChange = schema[key].onChange;
        if (typeof onChange === 'string' && typeof this[onChange] === 'function') {
          this[onChange](appliedVal, oldVal);
        } else if (typeof onChange === 'function') {
          onChange.call(this, appliedVal, oldVal);
        }
      }
    }

    this.settings = appliedSettings;

    if (hasCorrection && typeof this.props.onSettingsCorrected  === 'function') {
      this.props.onSettingsCorrected(correctedSettings);
    }
  }

  setupInterval(freq) {
    if (this.intervalId) clearInterval(this.intervalId);

    const seconds = Number(freq);
    const interval = isNaN(seconds) || seconds <= 0 ? 2000 : seconds * 1000;

    this.intervalId = setInterval(() => this.onUpdateTick(), interval);
  }

  onUpdateFrequencyChange(newFreq) {
    this.setupInterval(newFreq);
  }

  // 🔹 Override this in subclasses for immediate actions like first fetch
  onInit() {}

  // 🔹 Override this in subclasses for periodic updates
  onUpdateTick() {}

  render() {
    return <div>Figure base class (override render!)</div>;
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
