import TestBeamPlot from '../TestBeamPlot';
import SettingTypes from '../../../../enums/SettingTypes';
import { resolveGatewayUrl } from '../../../../config/runtimeConfig';

export default class AtarPlot extends TestBeamPlot {
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
    return this.plotLayout(xTitle || 'Horizontal coordinate', yTitle || 'Vertical coordinate', {
      showLegend: true,
    });
  }
  initPlot(payload) { return this.makePlot(payload); }
  updatePlot(payload) { return this.makePlot(payload); }
  noData() {
    return { data: [], layout: { ...this.baseLayout(), annotations: [this.emptyAnnotation('No live ATAR data found')] } };
  }
  matrix(data) {
    const nx = Number(data?.['x-bins']); const ny = Number(data?.['y-bins']);
    const flat = data?.counts || [];
    if (!nx || !ny || flat.length !== nx * ny) return null;
    return Array.from({ length: ny }, (_, y) => flat.slice(y * nx, (y + 1) * nx));
  }
}
