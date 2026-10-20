import Plot from '../plots/Plot';
import SettingTypes from '../../enums/SettingTypes';
import { resolveGatewayUrl } from '../../config/runtimeConfig';

export default class AtarPlot extends Plot {
  static viewName = '';
  static get settingSchema() {
    return {
      ...super.settingSchema,
      dataUrl: { type: SettingTypes.STRING, default: '/api/v1/atar', label: 'ATAR endpoint', advanced: true },
    };
  }
  getDataUrl() {
    const url = new URL(resolveGatewayUrl(this.settings.dataUrl));
    url.searchParams.set('view', this.constructor.viewName);
    return url.toString();
  }
  baseLayout(xTitle = '', yTitle = '') {
    return {
      autosize: true, margin: { t: 25, r: 24, l: 58, b: 48 },
      paper_bgcolor: '#fff', plot_bgcolor: '#f8fafc', font: { color: '#172033' },
      xaxis: { title: xTitle, gridcolor: '#dbe3ee' },
      yaxis: { title: yTitle, gridcolor: '#dbe3ee' },
      showlegend: true,
    };
  }
  initPlot(payload) { return this.makePlot(payload); }
  updatePlot(payload) { return this.makePlot(payload); }
  noData() {
    return { data: [], layout: { ...this.baseLayout(), annotations: [{ text: 'No live ATAR data found', x: 0.5, y: 0.5, xref: 'paper', yref: 'paper', showarrow: false }] } };
  }
  matrix(data) {
    const nx = Number(data?.['x-bins']); const ny = Number(data?.['y-bins']);
    const flat = data?.counts || [];
    if (!nx || !ny || flat.length !== nx * ny) return null;
    return Array.from({ length: ny }, (_, y) => flat.slice(y * nx, (y + 1) * nx));
  }
}
