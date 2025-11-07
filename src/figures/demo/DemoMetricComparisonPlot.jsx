import Plot from '../plots/Plot';
import SettingTypes from '../../enums/SettingTypes';

const DEFAULT_METRICS = [
  { name: 'Freshness', base: 97 },
  { name: 'Completeness', base: 93 },
  { name: 'Accuracy', base: 95 },
  { name: 'Anomalies', base: 88 },
  { name: 'Latency', base: 91 }
];

/**
 * Client-side metric trend chart that mixes bars with a rolling target line.
 */
export default class DemoMetricComparisonPlot extends Plot {
  static displayName = 'Demo • Metric Tracker';
  static name = 'DemoMetricComparisonPlot';

  constructor(props) {
    super(props);
    this.metrics = this.initializeMetrics();
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
        default: 1,
        label: 'Update Interval (s)',
        onChange: 'onUpdateFrequencyChange',
      },
      targetValue: {
        type: SettingTypes.NUMBER,
        default: 95,
        label: 'Target',
      },
      volatility: {
        type: SettingTypes.NUMBER,
        default: 1.2,
        label: 'Volatility',
      },
      highlightThreshold: {
        type: SettingTypes.NUMBER,
        default: 92,
        label: 'Highlight Threshold',
      },
    };
  }

  getDataUrl() {
    return 'None';
  }

  initPlot() {
    return this.formatMetrics(true);
  }

  updatePlot() {
    return this.formatMetrics(false);
  }

  initializeMetrics() {
    return DEFAULT_METRICS.map((metric, idx) => {
      const initial = metric.base + (Math.random() - 0.5) * 4;
      return {
        ...metric,
        value: initial,
        previous: initial - (Math.random() - 0.5) * 3,
        color: ['#22c55e', '#0ea5e9', '#f97316', '#a855f7', '#ef4444'][idx % 5],
      };
    });
  }

  mutateMetrics() {
    const { volatility } = this.settings;
    const clamp = (val) => Math.max(70, Math.min(100, val));

    this.metrics = this.metrics.map((metric) => {
      const drift = (Math.random() - 0.5) * volatility * 2;
      const newValue = clamp(metric.value + drift);
      return { ...metric, previous: metric.value, value: newValue };
    });
  }

  formatMetrics(includeLayout) {
    this.mutateMetrics();

    const { targetValue, highlightThreshold } = this.settings;
    const categories = this.metrics.map((m) => m.name);
    const values = this.metrics.map((m) => +m.value.toFixed(2));

    const barData = {
      type: 'bar',
      x: categories,
      y: values,
      marker: {
        color: this.metrics.map((metric) =>
          metric.value >= highlightThreshold ? metric.color : '#94a3b8'
        ),
      },
      name: 'Current',
      hovertemplate: '%{x}: %{y:.2f}%<extra></extra>',
    };

    const targetLine = {
      type: 'scatter',
      mode: 'lines',
      x: categories,
      y: categories.map(() => targetValue),
      line: { color: '#ef4444', width: 2, dash: 'dash' },
      name: 'Target',
      hoverinfo: 'skip',
    };

    const previousLine = {
      type: 'scatter',
      mode: 'lines+markers',
      x: categories,
      y: this.metrics.map((metric) => +metric.previous.toFixed(2)),
      line: { color: '#0ea5e9', width: 2 },
      marker: { size: 6 },
      name: 'Previous Cycle',
      hovertemplate: '%{x}: %{y:.2f}%<extra></extra>',
    };

    return {
      data: [barData, targetLine, previousLine],
      layout: includeLayout
        ? {
            barmode: 'overlay',
            legend: { orientation: 'h', x: 0, y: 1.15 },
            margin: { t: 50, r: 40, b: 60, l: 50 },
            yaxis: {
              title: 'Score (%)',
              range: [70, 100],
              ticksuffix: '%',
            },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            bargap: 0.35,
          }
        : undefined,
    };
  }
}
