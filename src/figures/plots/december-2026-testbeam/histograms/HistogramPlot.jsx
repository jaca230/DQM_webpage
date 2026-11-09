import TestBeamPlot from '../TestBeamPlot';
import SettingTypes from '../../../../enums/SettingTypes';
import { resolveGatewayUrl } from '../../../../config/runtimeConfig';

export default class HistogramPlot extends TestBeamPlot {
  static displayName = 'Live Histogram';
  static name = 'HistogramPlot';

  static get settingSchema() {
    return {
      ...super.settingSchema,
      histogramName: {
        type: SettingTypes.STRING,
        default: 'PulseIntegrals/wfd5/global/pulse_integral',
        label: 'Histogram name',
      },
      baseline: {
        type: SettingTypes.STRING,
        default: '',
        label: 'Baseline name',
        advanced: true,
      },
      maximumBins: {
        type: SettingTypes.INT,
        default: 256,
        label: 'Maximum displayed bins',
        advanced: true,
      },
      xAxisScale: {
        type: SettingTypes.SELECT,
        default: 'linear',
        label: 'Energy axis scale',
        options: ['linear', 'log'],
      },
      yAxisScale: {
        type: SettingTypes.SELECT,
        default: 'linear',
        label: 'Count axis scale',
        options: ['linear', 'log'],
      },
      dataUrl: {
        type: SettingTypes.STRING,
        default: '/api/v1/histograms',
        label: 'Histogram endpoint',
        advanced: true,
      },
    };
  }

  componentDidMount() {
    super.componentDidMount();
    if (this.getDataUrl() === 'None') this._updatePlotInternal(null);
  }

  getDataUrl() {
    const baseUrl = this.settings.dataUrl;
    if (baseUrl === 'None') return baseUrl;
    const url = new URL(resolveGatewayUrl(baseUrl));
    url.searchParams.set('name', this.getHistogramName());
    url.searchParams.set('max-bins', Math.max(1, this.settings.maximumBins));
    if (this.settings.baseline) url.searchParams.set('baseline', this.settings.baseline);
    return url.toString();
  }

  getHistogramName() {
    return this.settings.histogramName;
  }

  initPlot(payload) {
    const data = this.buildTraces(payload);
    const layout = this.plotLayout(this.axisTitle(payload), 'Entries');
    return {
      data,
      layout: {
        ...layout,
        xaxis: {
          ...layout.xaxis,
          type: this.settings.xAxisScale,
        },
        yaxis: {
          ...layout.yaxis,
          type: this.settings.yAxisScale,
          rangemode: this.settings.yAxisScale === 'linear' ? 'tozero' : undefined,
        },
        annotations: this.statusAnnotations(data),
      },
    };
  }

  updatePlot(payload) {
    const data = this.buildTraces(payload);
    return {
      data,
      layout: {
        ...this.state.layout,
        xaxis: {
          ...this.state.layout.xaxis,
          title: { text: this.axisTitle(payload), standoff: 12 },
          type: this.settings.xAxisScale,
        },
        yaxis: {
          ...this.state.layout.yaxis,
          type: this.settings.yAxisScale,
          rangemode: this.settings.yAxisScale === 'linear' ? 'tozero' : undefined,
        },
        annotations: this.statusAnnotations(data),
      },
    };
  }

  buildTraces(payload) {
    const edges = Array.isArray(payload?.edges) ? payload.edges.map(Number) : [];
    const counts = Array.isArray(payload?.counts) ? payload.counts.map(Number) : [];
    if (edges.length !== counts.length + 1 || counts.length === 0) return [];
    const firstPositive = edges.find((edge) => edge > 0);
    const plotEdges = this.settings.xAxisScale === 'log' && firstPositive
      ? edges.map((edge) => (edge > 0 ? edge : firstPositive * 0.1))
      : edges;

    return [{
      type: 'scatter',
      mode: 'lines',
      x: plotEdges,
      y: [...counts, counts[counts.length - 1]],
      line: { color: '#7c3aed', width: 1.5, shape: 'hv' },
      fill: 'tozeroy',
      fillcolor: 'rgba(124,58,237,0.16)',
      hovertemplate: 'Lower edge: %{x}<br>Count: %{y}<extra></extra>',
    }];
  }

  axisTitle(payload) {
    return payload?.units || 'Integrated pulse energy';
  }

  statusAnnotations(data) {
    if (data.length) return [];
    return [this.emptyAnnotation('No live histogram found')];
  }
}
