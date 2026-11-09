import AtarPlot from './AtarPlot';
export default class AtarHeatmapPlot extends AtarPlot {
  static xTitle = ''; static yTitle = '';
  makePlot(p) { const d = p?.data; const z = this.matrix(d); if (!z) return this.noData(); const x = Array.from({ length: d['x-bins'] }, (_, i) => d['x-min'] + (i + 0.5) * (d['x-max'] - d['x-min']) / d['x-bins']); const y = Array.from({ length: d['y-bins'] }, (_, i) => d['y-min'] + (i + 0.5) * (d['y-max'] - d['y-min']) / d['y-bins']); const layout = this.baseLayout(this.constructor.xTitle, this.constructor.yTitle); layout.margin.r = 82; return { data: [{ type: 'heatmap', x, y, z, colorscale: 'Viridis', colorbar: { title: 'Entries', thickness: 12, x: 1.02 } }], layout }; }
}
