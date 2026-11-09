import PulseIntegralPlot from './PulseIntegralPlot';
import SettingTypes from '../../../../enums/SettingTypes';

export default class HdSocPulseIntegralPlot extends PulseIntegralPlot {
  static displayName = 'HDSoC Pulse Integral';
  static name = 'HdSocPulseIntegralPlot';
  static detectorName = 'hdsoc';

  static get settingSchema() {
    const { channel, ...settings } = super.settingSchema;
    return {
      ...settings,
      board: { type: SettingTypes.INT, default: 0, label: 'Board' },
      channel,
    };
  }

  getSelection() {
    return { module: this.settings.board, submodule: 0, channel: this.settings.channel };
  }
}
