import Plot from '../plots/Plot';
import SettingTypes from '../../enums/SettingTypes';

export default class DetectorHeatmapPlot extends Plot {
  static displayName = 'Detector • Calorimeter Heatmap';
  static name = 'DetectorHeatmapPlot';

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
        label: 'Data URL (demo only)',
        advanced: true,
      },
      updateFrequency: {
        ...(base.updateFrequency || {}),
        default: 0.8,
        label: 'Refresh Interval (s)',
        onChange: 'onUpdateFrequencyChange',
      },
      sensorRows: {
        type: SettingTypes.INT,
        default: 10,
        label: 'Rows',
      },
      sensorCols: {
        type: SettingTypes.INT,
        default: 10,
        label: 'Columns',
      },
      hotspotDrift: {
        type: SettingTypes.NUMBER,
        default: 0.2,
        label: 'Hotspot Drift',
      },
    };
  }

  getDataUrl() {
    return 'None';
  }

  initPlot() {
    return this.generateHeatmap(true);
  }

  updatePlot() {
    return this.generateHeatmap(false);
  }

  generateHeatmap(includeLayout) {
    const { sensorRows, sensorCols, hotspotDrift } = this.settings;
    const rows = Math.max(4, Math.min(20, sensorRows));
    const cols = Math.max(4, Math.min(20, sensorCols));

    const hotspotX = (Math.sin(this.tick * hotspotDrift) + 1) / 2 * (cols - 1);
    const hotspotY = (Math.cos(this.tick * hotspotDrift * 0.9) + 1) / 2 * (rows - 1);

    const z = Array.from({ length: rows }, (_, rowIdx) =>
      Array.from({ length: cols }, (_, colIdx) => {
        const dx = colIdx - hotspotX;
        const dy = rowIdx - hotspotY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const pulse = Math.max(0, 1.4 - distance * 0.35);
        const ripple = 0.3 * Math.sin((this.tick * 0.4) + distance);
        const noise = (Math.random() - 0.5) * 0.08;
        return +(pulse + ripple + noise).toFixed(3);
      })
    );

    this.tick += 1;

    return {
      data: [
        {
          z,
          type: 'heatmap',
          colorscale: [
            [0, '#0f172a'],
            [0.25, '#1d4ed8'],
            [0.5, '#22d3ee'],
            [0.75, '#fde047'],
            [1, '#f97316'],
          ],
          showscale: true,
          hovertemplate: 'Module %{x}, Layer %{y}<br>Charge: %{z:.3f}<extra></extra>',
        },
      ],
      layout: includeLayout
        ? {
            margin: { t: 40, r: 0, b: 40, l: 50 },
            xaxis: { title: 'Module', showgrid: false },
            yaxis: { title: 'Layer', showgrid: false },
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent',
          }
        : undefined,
    };
  }
}
