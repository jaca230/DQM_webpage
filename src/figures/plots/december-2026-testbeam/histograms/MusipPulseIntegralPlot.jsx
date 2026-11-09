import PulseIntegralPlot from './PulseIntegralPlot';
import SettingTypes from '../../../../enums/SettingTypes';

export default class MusipPulseIntegralPlot extends PulseIntegralPlot {
  static displayName = 'MuSiP Energy';
  static name = 'MusipPulseIntegralPlot';
  static detectorName = 'musip';

  static get settingSchema() {
    const { channel, ...settings } = super.settingSchema;
    return {
      ...settings,
      group: { type: SettingTypes.INT, default: 0, label: 'Detector group / module' },
      channel,
    };
  }

  getSelection() {
    return { module: this.settings.group, submodule: 0, channel: this.settings.channel };
  }
}
