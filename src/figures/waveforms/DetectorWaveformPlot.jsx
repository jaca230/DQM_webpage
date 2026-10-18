import Plot from '../plots/Plot';
import SettingTypes from '../../enums/SettingTypes';
import WaveformDataAdapter from './WaveformDataAdapter';
import { resolveGatewayUrl } from '../../config/runtimeConfig';

export default class DetectorWaveformPlot extends Plot {
  static detectorName = 'detector';
  static lineColor = '#2563eb';

  static get settingSchema() {
    return {
      ...super.settingSchema,
      channel: {
        type: SettingTypes.INT,
        default: 0,
        label: 'Channel',
      },
      maximumSamples: {
        type: SettingTypes.INT,
        default: 256,
        label: 'Maximum displayed samples',
        advanced: true,
      },
      dataUrl: {
        type: SettingTypes.STRING,
        default: '/api/v1/waveforms',
        label: 'Waveform endpoint',
        advanced: true,
      },
    };
  }

  getSelection() {
    return { module: 0, submodule: 0, channel: this.settings.channel };
  }

  selectionLabel() {
    return `Ch${this.settings.channel}`;
  }

  componentDidMount() {
    super.componentDidMount();
    if (this.getDataUrl() === 'None') this._updatePlotInternal(null);
  }

  getDataUrl() {
    const baseUrl = this.settings.dataUrl;
    if (baseUrl === 'None') return baseUrl;
    const url = new URL(resolveGatewayUrl(baseUrl));
    url.searchParams.set('detector', this.constructor.detectorName);
    const selection = this.getSelection();
    url.searchParams.set('module', selection.module);
    url.searchParams.set('submodule', selection.submodule);
    url.searchParams.set('channel', selection.channel);
    url.searchParams.set('max-samples', this.settings.maximumSamples);
    return url.toString();
  }

  initPlot(payload) {
    const data = this.buildTraces(payload);
    return {
      data,
      layout: {
        autosize: true,
        margin: { t: 20, r: 20, l: 58, b: 48 },
        paper_bgcolor: '#ffffff',
        plot_bgcolor: '#f8fafc',
        font: { color: '#172033' },
        xaxis: { title: 'Time (ns)', gridcolor: '#dbe3ee', zerolinecolor: '#94a3b8' },
        yaxis: { title: 'ADC value', gridcolor: '#dbe3ee', zerolinecolor: '#94a3b8' },
        showlegend: true,
        legend: { orientation: 'h', y: -0.22 },
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
        annotations: this.statusAnnotations(data),
      },
    };
  }

  buildTraces(payload) {
    const waveform = payload ? this.waveformFromPayload(payload) : null;
    const samples = WaveformDataAdapter.samples(waveform);
    if (!samples?.length) return [];
    const productPeriod = Number(waveform?.['sample-period-ns']);
    const period = Number.isFinite(productPeriod) && productPeriod > 0 ? productPeriod : 1;
    const explicitTimes = WaveformDataAdapter.times(waveform);
    const name = `${this.constructor.detectorName} ${this.selectionLabel()}`;
    return [{
      // Gateway views are already bounded/downsampled. SVG scatter avoids the
      // noisy WebGL clear-with-empty-mask path in Plotly during live updates.
      type: 'scatter',
      mode: 'lines',
      x: explicitTimes || samples.map((_, index) => index * period),
      y: samples,
      name,
      line: { color: this.constructor.lineColor, width: 1.5 },
      hovertemplate: '%{x:.2f} ns<br>%{y:.2f}<extra>%{fullData.name}</extra>',
    }];
  }

  waveformFromPayload(payload) {
    const selection = this.getSelection();
    return WaveformDataAdapter.find(payload, {
      detector: this.constructor.detectorName,
      ...selection,
    });
  }

  statusAnnotations(data) {
    if (data.length) return [];
    return [{
      text: 'No live data found',
      x: 0.5,
      y: 0.5,
      xref: 'paper',
      yref: 'paper',
      showarrow: false,
      font: { color: '#64748b', size: 16 },
    }];
  }
}
