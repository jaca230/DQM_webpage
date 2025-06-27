import React from 'react';
import StaticFigure from './StaticFigure';
import SettingTypes from '../enums/SettingTypes';

export default class Figure extends StaticFigure {
  static displayName = 'Figure';
  static name = 'Figure';
  static get settingSchema() {
    return {
      ...super.settingSchema,
      dataUrl: {
        type: SettingTypes.STRING,
        default: 'http://localhost/api/default_data',
        label: 'Data URL',
        advanced: false,
      },
      updateFrequency: {
        type: SettingTypes.NUMBER,
        default: 2,
        label: 'Update Interval (s)',
        onChange: 'onUpdateFrequencyChange',
        advanced: false,
      },
    };
  }

  constructor(props) {
    super(props);
    this.intervalId = null;
  }

  getDataUrl() {
    return this.settings.dataUrl;
  }

  componentDidMount() {
    this.onInit(); // One-time init call
    this.setupInterval(this.settings.updateFrequency);
  }

  componentWillUnmount() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  componentDidUpdate(prevProps) {
    super.componentDidUpdate(prevProps); // Apply settings corrections etc

    const oldFreq = prevProps.settings?.updateFrequency;
    const newFreq = this.settings.updateFrequency;

    if (oldFreq !== newFreq) {
      this.setupInterval(newFreq);
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

  // Override these in subclasses:
  onInit() {}
  onUpdateTick() {}

  render() {
    return <div>Figure base class (override render!)</div>;
  }
}
