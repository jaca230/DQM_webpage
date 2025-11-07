import Plot from '../plots/Plot';
import SettingTypes from '../../enums/SettingTypes';

export default class ParticleTracePlot extends Plot {
  static displayName = 'Detector • Particle Trace';
  static name = 'ParticleTracePlot';

  constructor(props) {
    super(props);
    this.tick = 0;
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
        default: 0.5,
        label: 'Refresh Interval (s)',
        onChange: 'onUpdateFrequencyChange',
      },
      particleCount: {
        type: SettingTypes.INT,
        default: 80,
        label: 'Particles',
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
    const count = Math.max(20, Math.min(200, this.settings.particleCount || 80));
    const theta = Array.from({ length: count }, (_, idx) => (idx / count) * Math.PI * 4);

    const spiral = theta.map((angle) => ({
      x: Math.cos(angle + this.tick * 0.04) * (angle * 6),
      y: Math.sin(angle + this.tick * 0.04) * (angle * 6),
    }));

    const energy = theta.map((angle, idx) =>
      0.5 + 0.4 * Math.sin(angle * 0.7 + this.tick * 0.3) + (idx / count) * 0.5
    );

    this.tick += 1;

    return {
      data: [
        {
          x: spiral.map((p) => p.x),
          y: spiral.map((p) => p.y),
          mode: 'markers',
          marker: {
            size: energy.map((e) => 6 + e * 4),
            color: energy,
            colorscale: 'Turbo',
            opacity: 0.9,
          },
          type: 'scattergl',
          hovertemplate: 'x %{x:.1f}, y %{y:.1f}<extra></extra>',
          name: 'Track Energy',
        },
      ],
      layout: includeLayout
        ? {
            margin: { t: 30, r: 30, b: 30, l: 30 },
            xaxis: { title: 'X (mm)', showgrid: false, zeroline: false },
            yaxis: { title: 'Y (mm)', showgrid: false, zeroline: false },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'rgba(15,23,42,0.95)',
            font: { color: '#94a3b8' },
          }
        : undefined,
    };
  }
}
