import Plot from '../plots/Plot';
import SettingTypes from '../../enums/SettingTypes';

export default class OscilloscopeTracePlot extends Plot {
  static displayName = 'DAQ • Oscilloscope Traces';
  static name = 'OscilloscopeTracePlot';

  constructor(props) {
    super(props);
    this.phase = 0;
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
        default: 0.4,
        label: 'Refresh Interval (s)',
        onChange: 'onUpdateFrequencyChange',
      },
      channelCount: {
        type: SettingTypes.INT,
        default: 3,
        label: 'Channels',
      },
      sampleCount: {
        type: SettingTypes.INT,
        default: 200,
        label: 'Samples',
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
    const channels = Math.max(1, Math.min(4, this.settings.channelCount || 3));
    const samples = Math.max(80, Math.min(400, this.settings.sampleCount || 200));
    const x = Array.from({ length: samples }, (_, idx) => idx * 2);

    const palette = ['#22d3ee', '#f97316', '#a855f7', '#38bdf8'];

    const traces = Array.from({ length: channels }, (_, idx) => {
      const offset = idx * 1.2;
      const waveform = x.map((sample) => {
        const pulse = Math.exp(-Math.pow((sample - 120 - idx * 15) / 25, 2));
        const ringing = 0.25 * Math.sin(sample * 0.25 + this.phase + idx);
        const noise = (Math.random() - 0.5) * 0.15;
        return offset + pulse * (1.5 + idx * 0.2) + ringing + noise;
      });

      return {
        x,
        y: waveform,
        mode: 'lines',
        line: {
          width: 2,
          color: palette[idx % palette.length],
        },
        name: `CH${idx + 1}`,
      };
    });

    this.phase += 0.35;

    return {
      data: traces,
      layout: includeLayout
        ? {
            margin: { t: 40, r: 20, b: 40, l: 55 },
            xaxis: { title: 'Time (ns)', showgrid: true, gridcolor: 'rgba(148,163,184,0.2)' },
            yaxis: { title: 'Voltage (arb)', showgrid: true, gridcolor: 'rgba(148,163,184,0.2)' },
            paper_bgcolor: 'transparent',
            plot_bgcolor: '#0f172a',
            font: { color: '#e2e8f0' },
            legend: { orientation: 'h', x: 0, y: 1.1 },
          }
        : undefined,
    };
  }
}
