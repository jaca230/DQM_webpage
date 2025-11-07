import Plot from '../plots/Plot';
import SettingTypes from '../../enums/SettingTypes';

/**
 * Animated sine/ cosine pair that runs entirely on the client via NoFetchStrategy.
 */
export default class DemoSineWavePlot extends Plot {
  static displayName = 'Demo • Animated Sine Wave';
  static name = 'DemoSineWavePlot';

  constructor(props) {
    super(props);
    this.tick = 0;
  }

  static get settingSchema() {
    const parentSchema = super.settingSchema || {};
    return {
      ...parentSchema,
      dataUrl: {
        ...(parentSchema.dataUrl || {}),
        default: 'None',
        label: 'Data URL (unused in demo)',
        advanced: true,
      },
      updateFrequency: {
        ...(parentSchema.updateFrequency || {}),
        type: SettingTypes.NUMBER,
        default: 0.4,
        label: 'Animation Interval (s)',
        onChange: 'onUpdateFrequencyChange',
      },
      amplitude: {
        type: SettingTypes.NUMBER,
        default: 1.6,
        label: 'Amplitude',
      },
      frequency: {
        type: SettingTypes.NUMBER,
        default: 0.8,
        label: 'Frequency',
      },
      waveSpeed: {
        type: SettingTypes.NUMBER,
        default: 0.35,
        label: 'Wave Speed',
      },
      noise: {
        type: SettingTypes.NUMBER,
        default: 0.12,
        label: 'Noise',
      },
      showMarkers: {
        type: SettingTypes.BOOLEAN,
        default: false,
        label: 'Show Markers',
      },
      mirrorWave: {
        type: SettingTypes.BOOLEAN,
        default: true,
        label: 'Mirror Wave',
      },
    };
  }

  getDataUrl() {
    return 'None';
  }

  initPlot() {
    return this.generatePlot(true);
  }

  updatePlot() {
    return this.generatePlot(false);
  }

  generatePlot(includeLayout) {
    const points = 220;
    const { amplitude, frequency, noise, showMarkers, mirrorWave } = this.settings;
    const speed = this.settings.waveSpeed || 0.2;
    const phase = this.tick * speed;
    const x = Array.from({ length: points }, (_, idx) => idx / 12);

    const primary = x.map((value, idx) => {
      const base = amplitude * Math.sin(frequency * value + phase);
      return +(base + (Math.random() - 0.5) * noise).toFixed(3);
    });

    const traces = [
      {
        x,
        y: primary,
        type: 'scatter',
        mode: showMarkers ? 'lines+markers' : 'lines',
        marker: { color: '#1d4ed8', size: 6, symbol: 'circle-open' },
        line: { color: '#1d4ed8', width: 3 },
        name: 'Signal A',
      },
    ];

    if (mirrorWave) {
      const secondary = primary.map((val, idx) => val * 0.7 + 0.4 * Math.cos((idx / points) * Math.PI * 2 + phase));
      traces.push({
        x,
        y: secondary,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#f97316', width: 2, dash: 'dot' },
        name: 'Signal B',
      });
    }

    this.tick += 1;

    return {
      data: traces,
      layout: includeLayout
        ? {
            autosize: true,
            margin: { t: 40, r: 20, b: 40, l: 50 },
            showlegend: true,
            legend: { orientation: 'h', x: 0, y: 1.2 },
            xaxis: { title: 'Sample', zeroline: false },
            yaxis: { title: 'Amplitude', range: [-2.5, 2.5], zeroline: false },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
          }
        : undefined,
    };
  }
}
