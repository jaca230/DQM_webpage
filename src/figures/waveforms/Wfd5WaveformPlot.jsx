import DetectorWaveformPlot from './DetectorWaveformPlot';
import SettingTypes from '../../enums/SettingTypes';

export default class Wfd5WaveformPlot extends DetectorWaveformPlot {
  static displayName = 'WFD5 Waveform';
  static name = 'Wfd5WaveformPlot';
  static detectorName = 'wfd5';
  static lineColor = '#2563eb';

  static get settingSchema() {
    return {
      ...super.settingSchema,
      crate: { type: SettingTypes.INT, default: 0, label: 'Crate' },
      amc: { type: SettingTypes.INT, default: 1, label: 'AMC / module' },
    };
  }

  getSelection() {
    return { module: this.settings.crate, submodule: this.settings.amc, channel: this.settings.channel };
  }

  selectionLabel() {
    return `C${this.settings.crate} AMC${this.settings.amc} Ch${this.settings.channel}`;
  }
}
