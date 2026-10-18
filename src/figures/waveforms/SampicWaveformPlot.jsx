import DetectorWaveformPlot from './DetectorWaveformPlot';
import SettingTypes from '../../enums/SettingTypes';

export default class SampicWaveformPlot extends DetectorWaveformPlot {
  static displayName = 'SAMPIC Waveform';
  static name = 'SampicWaveformPlot';
  static detectorName = 'sampic';
  static lineColor = '#7c3aed';

  static get settingSchema() {
    return {
      ...super.settingSchema,
      crate: { type: SettingTypes.INT, default: 0, label: 'Crate' },
      feb: { type: SettingTypes.INT, default: 0, label: 'Frontend board (0–3)' },
      chip: { type: SettingTypes.INT, default: 0, label: 'SAMPIC chip (0–3)' },
    };
  }

  getSelection() {
    return {
      module: this.settings.crate * 4 + this.settings.feb,
      submodule: this.settings.chip,
      channel: this.settings.channel,
    };
  }

  selectionLabel() {
    return `C${this.settings.crate} FEB${this.settings.feb} S${this.settings.chip} Ch${this.settings.channel}`;
  }
}
