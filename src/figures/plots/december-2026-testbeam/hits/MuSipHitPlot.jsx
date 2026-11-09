import TestBeamPlot from '../TestBeamPlot';
import SettingTypes from '../../../../enums/SettingTypes';
import { resolveGatewayUrl } from '../../../../config/runtimeConfig';

export default class MuSipHitPlot extends TestBeamPlot {
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
    const layout = this.plotLayout(
      'Time since first displayed hit (ns)',
      'Observed energy / ToT',
    );
    return {
      data,
      layout: {
        ...layout,
        yaxis: {
          ...layout.yaxis,
          rangemode: 'tozero',
        },
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
    return [this.emptyAnnotation('No live hit data found')];
  }
}
