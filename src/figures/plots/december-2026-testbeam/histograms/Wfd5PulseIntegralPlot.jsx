import PulseIntegralPlot from './PulseIntegralPlot';
import SettingTypes from '../../../../enums/SettingTypes';

export default class Wfd5PulseIntegralPlot extends PulseIntegralPlot {
  static displayName = 'WFD5 Pulse Integral';
  static name = 'Wfd5PulseIntegralPlot';
  static detectorName = 'wfd5';

  static get settingSchema() {
    const { channel, ...settings } = super.settingSchema;
    return {
      ...settings,
      crate: { type: SettingTypes.INT, default: 0, label: 'Crate' },
      amc: { type: SettingTypes.INT, default: 1, label: 'AMC / module' },
      channel,
    };
  }

  getSelection() {
    return {
      module: this.settings.crate,
      submodule: this.settings.amc,
      channel: this.settings.channel,
    };
  }
}
