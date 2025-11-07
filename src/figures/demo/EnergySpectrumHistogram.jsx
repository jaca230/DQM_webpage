import Plot from '../plots/Plot';
import SettingTypes from '../../enums/SettingTypes';

export default class EnergySpectrumHistogram extends Plot {
  static displayName = 'Updating Histogram';
  static name = 'EnergySpectrumHistogram';

  constructor(props) {
    super(props);
    this.sampleBuffer = [];
  }

  static get settingSchema() {
    const base = super.settingSchema || {};
    return {
      ...base,
      dataUrl: {
        ...(base.dataUrl || {}),
        default: 'None',
        label: 'Data URL (unused)',
        advanced: true,
      },
      updateFrequency: {
        ...(base.updateFrequency || {}),
        default: 1,
        label: 'Refresh Interval (s)',
        onChange: 'onUpdateFrequencyChange',
      },
      meanEnergy: {
        type: SettingTypes.NUMBER,
        default: 4.5,
        label: 'Mean (MeV)',
      },
      spread: {
        type: SettingTypes.NUMBER,
        default: 1.4,
        label: 'Spread',
      },
    };
  }

  getDataUrl() {
    return 'None';
  }

  initPlot() {
    return this.buildPlot(true);
  }

  updatePlot() {
    return this.buildPlot(false);
  }

  buildPlot(includeLayout) {
    const { meanEnergy, spread } = this.settings;
    const batch = Array.from({ length: 200 }, () =>
      Math.max(0.1, this.gaussian(meanEnergy, spread))
    );

    this.sampleBuffer = [...this.sampleBuffer, ...batch].slice(-2000);

    return {
      data: [
        {
          type: 'histogram',
          x: this.sampleBuffer,
          nbinsx: 40,
          marker: {
            color: '#22d3ee',
          },
          opacity: 0.85,
          hovertemplate: '%{x:.2f} MeV: %{y} counts<extra></extra>',
        },
      ],
      layout: includeLayout
        ? {
            margin: { t: 40, r: 20, b: 40, l: 60 },
            xaxis: { title: 'Energy (MeV)' },
            yaxis: { title: 'Counts' },
            bargap: 0.05,
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
          }
        : undefined,
    };
  }

  gaussian(mean, stdDev) {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const mag = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + mag * stdDev;
  }
}
