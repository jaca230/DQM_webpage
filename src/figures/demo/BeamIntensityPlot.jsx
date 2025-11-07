import Plot from '../plots/Plot';
import SettingTypes from '../../enums/SettingTypes';

export default class BeamIntensityPlot extends Plot {
  static displayName = 'Ticker Plot';
  static name = 'BeamIntensityPlot';

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
        label: 'Data URL (demo only)',
        advanced: true,
      },
      updateFrequency: {
        ...(base.updateFrequency || {}),
        default: 0.5,
        label: 'Refresh Interval (s)',
        onChange: 'onUpdateFrequencyChange',
      },
      amplitude: {
        type: SettingTypes.NUMBER,
        default: 1.2,
        label: 'Pulse Amplitude',
      },
      jitter: {
        type: SettingTypes.NUMBER,
        default: 0.15,
        label: 'Noise',
      },
      harmonics: {
        type: SettingTypes.INT,
        default: 3,
        label: 'Harmonics',
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
    const points = 280;
    const { amplitude, jitter, harmonics } = this.settings;
    const x = Array.from({ length: points }, (_, i) => i / 4);

    const base = x.map((value) => {
      const harmonicSum = Array.from({ length: harmonics }, (_, idx) => {
        const harmonic = idx + 1;
        return (amplitude / harmonic) * Math.sin(harmonic * value * 0.4 + this.phase * harmonic);
      }).reduce((sum, val) => sum + val, 0);
      const modulation = 0.4 * Math.sin(value * 0.03 + this.phase * 0.5);
      const noise = (Math.random() - 0.5) * jitter;
      return harmonicSum + modulation + noise;
    });

    const envelopeHigh = base.map((val, idx) =>
      val + 0.3 + 0.15 * Math.sin(idx * 0.02 + this.phase)
    );
    const envelopeLow = base.map((val, idx) =>
      val - 0.3 - 0.15 * Math.cos(idx * 0.025 + this.phase)
    );

    this.phase += 0.3;

    return {
      data: [
        {
          x,
          y: envelopeHigh,
          mode: 'lines',
          line: { color: '#facc15', width: 0 },
          showlegend: false,
        },
        {
          x,
          y: envelopeLow,
          mode: 'lines',
          line: { color: '#facc15', width: 0 },
          fill: 'tonexty',
          fillcolor: 'rgba(234,179,8,0.25)',
          showlegend: false,
        },
        {
          x,
          y: base,
          mode: 'lines',
          line: { color: '#f97316', width: 3 },
          name: 'Beam Pulse',
        },
      ],
      layout: includeLayout
        ? {
            margin: { t: 40, r: 20, b: 40, l: 50 },
            xaxis: { title: 'Time (µs)' },
            yaxis: { title: 'Normalized Intensity' },
            plot_bgcolor: 'rgba(8,15,40,0.95)',
            paper_bgcolor: 'transparent',
            font: { color: '#e2e8f0' },
            shapes: [
              {
                type: 'line',
                x0: x[0],
                x1: x[points - 1],
                y0: 0,
                y1: 0,
                line: { color: 'rgba(148,163,184,0.3)', dash: 'dot' },
              },
            ],
          }
        : undefined,
    };
  }
}
