import Plot from '../plots/Plot';
import SettingTypes from '../../enums/SettingTypes';

export default class BeamProfileHistogram extends Plot {
  static displayName = 'Beam • Profile Histogram';
  static name = 'BeamProfileHistogram';

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
        default: 0.7,
        label: 'Refresh Interval (s)',
        onChange: 'onUpdateFrequencyChange',
      },
      sigmaX: {
        type: SettingTypes.NUMBER,
        default: 6,
        label: 'Sigma X (mm)',
      },
      sigmaY: {
        type: SettingTypes.NUMBER,
        default: 3.5,
        label: 'Sigma Y (mm)',
      },
      rotation: {
        type: SettingTypes.NUMBER,
        default: 12,
        label: 'Rotation (deg)',
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
    const { sigmaX, sigmaY, rotation } = this.settings;
    const samples = 2200;
    const rotRad = (rotation + Math.sin(this.tick * 0.08) * 2) * (Math.PI / 180);

    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);

    const points = Array.from({ length: samples }, () => {
      const gx = this.gaussian(0, sigmaX * (1 + Math.sin(this.tick * 0.01) * 0.1));
      const gy = this.gaussian(0, sigmaY * (1 + Math.cos(this.tick * 0.015) * 0.1));
      return {
        x: gx * cosR - gy * sinR,
        y: gx * sinR + gy * cosR,
      };
    });

    this.tick += 1;

    return {
      data: [
        {
          x: points.map((p) => p.x),
          y: points.map((p) => p.y),
          type: 'histogram2dcontour',
          colorscale: 'Viridis',
          contours: {
            coloring: 'fill',
            showlabels: false,
          },
          ncontours: 18,
          showscale: true,
        },
      ],
      layout: includeLayout
        ? {
            margin: { t: 40, r: 30, b: 40, l: 55 },
            xaxis: { title: 'Horizontal (mm)', zeroline: false },
            yaxis: { title: 'Vertical (mm)', zeroline: false },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'rgba(15,23,42,0.9)',
            font: { color: '#e2e8f0' },
          }
        : undefined,
    };
  }

  gaussian(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const mag = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + mag * stdDev;
  }
}
