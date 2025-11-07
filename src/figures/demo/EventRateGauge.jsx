import Plot from '../plots/Plot';
import SettingTypes from '../../enums/SettingTypes';

export default class EventRateGauge extends Plot {
  static displayName = 'Beam • Event Rate Gauge';
  static name = 'EventRateGauge';

  constructor(props) {
    super(props);
    this.value = 240;
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
        default: 0.6,
        label: 'Refresh Interval (s)',
        onChange: 'onUpdateFrequencyChange',
      },
      targetRate: {
        type: SettingTypes.NUMBER,
        default: 250,
        label: 'Target kHz',
      },
      maxRate: {
        type: SettingTypes.NUMBER,
        default: 320,
        label: 'Max kHz',
      },
    };
  }

  getDataUrl() {
    return 'None';
  }

  initPlot() {
    return this.buildGauge(true);
  }

  updatePlot() {
    return this.buildGauge(false);
  }

  buildGauge(includeLayout) {
    const { targetRate, maxRate } = this.settings;
    const drift = (Math.random() - 0.5) * 12;
    this.value = Math.max(120, Math.min(maxRate, this.value + drift));

    return {
      data: [
        {
          type: 'indicator',
          mode: 'gauge+number+delta',
          value: this.value,
          delta: { reference: targetRate, increasing: { color: '#22c55e' }, decreasing: { color: '#f87171' } },
          gauge: {
            axis: { range: [0, maxRate], tickwidth: 1, tickcolor: '#94a3b8' },
            bar: { color: '#38bdf8' },
            bgcolor: 'transparent',
            borderwidth: 1,
            bordercolor: '#1e293b',
            steps: [
              { range: [0, targetRate * 0.7], color: 'rgba(15,118,110,0.25)' },
              { range: [targetRate * 0.7, targetRate], color: 'rgba(8,145,178,0.35)' },
              { range: [targetRate, maxRate], color: 'rgba(248,113,113,0.35)' },
            ],
            threshold: {
              line: { color: '#f97316', width: 4 },
              thickness: 0.75,
              value: targetRate,
            },
          },
          domain: { x: [0, 1], y: [0, 1] },
          number: { suffix: ' kHz', valueformat: '.0f' },
          title: { text: 'Collision Rate', font: { size: 18 } },
        },
      ],
      layout: includeLayout
        ? {
            margin: { t: 40, r: 25, b: 20, l: 25 },
            paper_bgcolor: 'rgba(15,23,42,0.95)',
            font: { color: '#e2e8f0' },
          }
        : undefined,
    };
  }
}
