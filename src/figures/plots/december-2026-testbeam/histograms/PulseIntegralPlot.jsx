import HistogramPlot from './HistogramPlot';
import SettingTypes from '../../../../enums/SettingTypes';

export default class PulseIntegralPlot extends HistogramPlot {
  static detectorName = 'detector';

  static get settingSchema() {
    const { histogramName, ...histogramSettings } = super.settingSchema;
    return {
      ...histogramSettings,
      scope: {
        type: SettingTypes.SELECT,
        default: 'global',
        label: 'Histogram scope',
        options: ['global', 'channel'],
      },
      channel: {
        type: SettingTypes.INT,
        default: 0,
        label: 'Channel',
      },
    };
  }

  getSelection() {
    return { module: 0, submodule: 0, channel: this.settings.channel };
  }

  getHistogramName() {
    const prefix = `PulseIntegrals/${this.constructor.detectorName}`;
    if (this.settings.scope === 'global') return `${prefix}/global/pulse_integral`;
    const { module, submodule, channel } = this.getSelection();
    return `${prefix}/module-${module}/submodule-${submodule}/channel-${channel}/pulse_integral`;
  }
}
