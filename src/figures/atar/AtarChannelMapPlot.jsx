import AtarPlot from './AtarPlot';
export default class AtarChannelMapPlot extends AtarPlot {
  makePlot(p) {
    const g = p?.geometry; const d = p?.data; if (!g || !d?.long?.length) return this.noData();
    const strips = g['strips-per-layer']; const reshape = v => Array.from({ length: g.layers }, (_, l) => v.slice(l * strips, (l + 1) * strips));
    const delta = d.recent.map((v, i) => v - d.long[i]);
    return { data: [
      { type: 'heatmap', z: reshape(d.long), colorscale: 'Viridis', name: 'Long window', colorbar: { title: 'Long', x: 0.29 }, xaxis: 'x', yaxis: 'y' },
      { type: 'heatmap', z: reshape(d.recent), colorscale: 'Viridis', name: 'Recent', colorbar: { title: 'Recent', x: 0.64 }, xaxis: 'x2', yaxis: 'y2' },
      { type: 'heatmap', z: reshape(delta), colorscale: 'RdBu', zmid: 0, name: 'Change', colorbar: { title: 'Δ' }, xaxis: 'x3', yaxis: 'y3' },
    ], layout: { ...this.baseLayout(), grid: { rows: 1, columns: 3, pattern: 'independent' }, xaxis: { title: 'Strip' }, yaxis: { title: 'Layer' }, xaxis2: { title: 'Strip' }, yaxis2: { title: 'Layer' }, xaxis3: { title: 'Strip' }, yaxis3: { title: 'Layer' } } };
  }
}
