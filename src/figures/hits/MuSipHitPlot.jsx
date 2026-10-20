import Plot from '../plots/Plot';
import SettingTypes from '../../enums/SettingTypes';
import { resolveGatewayUrl } from '../../config/runtimeConfig';

export default class MuSipHitPlot extends Plot {
  static displayName = 'MuSiP Hit Energy';
  static name = 'MuSipHitPlot';

  static get settingSchema() {
    return {
      ...super.settingSchema,
      group: { type: SettingTypes.INT, default: 0, label: 'Detector group' },
      channel: { type: SettingTypes.INT, default: 0, label: 'Channel' },
      maximumHits: {
        type: SettingTypes.INT,
        default: 256,
        label: 'Maximum displayed hits',
        advanced: true,
      },
      dataUrl: {
        type: SettingTypes.STRING,
        default: '/api/v1/hit-series',
        label: 'Hit-series endpoint',
        advanced: true,
      },
    };
  }

  getDataUrl() {
    const url = new URL(resolveGatewayUrl(this.settings.dataUrl));
    url.searchParams.set('detector', 'musip');
    url.searchParams.set('module', this.settings.group);
    url.searchParams.set('submodule', 0);
    url.searchParams.set('channel', this.settings.channel);
    url.searchParams.set('max-hits', Math.max(1, this.settings.maximumHits));
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
        xaxis: { title: 'Time since first displayed hit (ns)', gridcolor: '#dbe3ee' },
        yaxis: { title: 'ToT / observed energy', rangemode: 'tozero', gridcolor: '#dbe3ee' },
        showlegend: false,
        annotations: this.statusAnnotations(data),
      },
    };
  }

  updatePlot(payload) {
    const data = this.buildTraces(payload);
    return {
      data,
      layout: { ...this.state.layout, annotations: this.statusAnnotations(data) },
    };
  }

  buildTraces(payload) {
    const series = payload?.['hit-series']?.[0];
    const times = series?.['times-ns'];
    const energies = series?.energies;
    if (!Array.isArray(times) || !Array.isArray(energies) ||
        times.length === 0 || times.length !== energies.length) return [];
    const numericTimes = times.map(Number);
    const origin = Math.min(...numericTimes);
    return [{
      type: 'scatter',
      mode: 'markers',
      x: numericTimes.map((time) => time - origin),
      y: energies.map(Number),
      customdata: numericTimes,
      marker: { color: '#dc2626', size: 6, opacity: 0.75 },
      hovertemplate: '%{x:.2f} ns from first hit<br>Detector time: %{customdata:.2f} ns<br>Energy: %{y:.2f}<extra></extra>',
    }];
  }

  statusAnnotations(data) {
    if (data.length) return [];
    return [{
      text: 'No live hit data found',
      x: 0.5,
      y: 0.5,
      xref: 'paper',
      yref: 'paper',
      showarrow: false,
      font: { color: '#64748b', size: 16 },
    }];
  }
}
