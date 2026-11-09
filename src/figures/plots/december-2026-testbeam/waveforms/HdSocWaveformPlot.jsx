import DetectorWaveformPlot from './DetectorWaveformPlot';
import SettingTypes from '../../../../enums/SettingTypes';

export default class HdSocWaveformPlot extends DetectorWaveformPlot {
  static displayName = 'HDSoC Waveform';
  static name = 'HdSocWaveformPlot';
  static detectorName = 'hdsoc';
  static lineColor = '#059669';

  static get settingSchema() {
    return {
      ...super.settingSchema,
      board: { type: SettingTypes.INT, default: 0, label: 'Board' },
    };
  }

  getSelection() {
    return { module: this.settings.board, submodule: 0, channel: this.settings.channel };
  }

  selectionLabel() {
    return `B${this.settings.board} Ch${this.settings.channel}`;
  }
}
