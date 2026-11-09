import PulseIntegralPlot from './PulseIntegralPlot';
import SettingTypes from '../../../../enums/SettingTypes';

export default class SampicPulseIntegralPlot extends PulseIntegralPlot {
  static displayName = 'SAMPIC Pulse Integral';
  static name = 'SampicPulseIntegralPlot';
  static detectorName = 'sampic';

  static get settingSchema() {
    const { channel, ...settings } = super.settingSchema;
    return {
      ...settings,
      crate: { type: SettingTypes.INT, default: 0, label: 'Crate' },
      feb: { type: SettingTypes.INT, default: 0, label: 'Frontend board (0–3)' },
      chip: { type: SettingTypes.INT, default: 0, label: 'SAMPIC chip (0–3)' },
      channel,
    };
  }

  getSelection() {
    return {
      module: this.settings.crate * 4 + this.settings.feb,
      submodule: this.settings.chip,
      channel: this.settings.channel,
    };
  }
}
