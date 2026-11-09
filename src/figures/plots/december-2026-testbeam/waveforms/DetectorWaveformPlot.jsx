import TestBeamPlot from '../TestBeamPlot';
import SettingTypes from '../../../../enums/SettingTypes';
import WaveformDataAdapter from './WaveformDataAdapter';
import { resolveGatewayUrl } from '../../../../config/runtimeConfig';

export default class DetectorWaveformPlot extends TestBeamPlot {
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
      lineColor: {
        type: SettingTypes.COLOR,
        default: this.lineColor,
        label: 'Waveform color',
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

  followsLatest() {
    return false;
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
    if (this.followsLatest()) {
      url.searchParams.set('latest', 'true');
    } else {
      const selection = this.getSelection();
      url.searchParams.set('module', selection.module);
      url.searchParams.set('submodule', selection.submodule);
      url.searchParams.set('channel', selection.channel);
    }
    url.searchParams.set('max-samples', this.settings.maximumSamples);
    return url.toString();
  }

  initPlot(payload) {
    const data = this.buildTraces(payload);
    const layout = this.plotLayout('Time (ns)', 'Digitized signal (ADC or V)', {
      showLegend: true,
      topMargin: 50,
    });
    return {
      data,
      layout: {
        ...layout,
        legend: { orientation: 'h', x: 0, y: 1.06, xanchor: 'left', yanchor: 'bottom' },
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
    const name = `${this.constructor.detectorName} ${this.selectionLabel(waveform)}`;
    return [{
      // Gateway views are already bounded/downsampled. SVG scatter avoids the
      // noisy WebGL clear-with-empty-mask path in Plotly during live updates.
      type: 'scatter',
      mode: 'lines',
      x: explicitTimes || samples.map((_, index) => index * period),
      y: samples,
      name,
      line: { color: this.settings.lineColor, width: 1.5 },
      hovertemplate: '%{x:.2f} ns<br>%{y:.2f}<extra>%{fullData.name}</extra>',
    }];
  }

  waveformFromPayload(payload) {
    if (this.followsLatest()) {
      return WaveformDataAdapter.first(payload, this.constructor.detectorName);
    }
    const selection = this.getSelection();
    return WaveformDataAdapter.find(payload, {
      detector: this.constructor.detectorName,
      ...selection,
    });
  }

  statusAnnotations(data) {
    if (data.length) return [];
    return [this.emptyAnnotation('No live data found')];
  }
}
