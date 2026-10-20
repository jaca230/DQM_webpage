import AtarPlot from './AtarPlot';
export default class AtarChannelMapPlot extends AtarPlot {
  makePlot(p) {
    const g = p?.geometry; const d = p?.data; if (!g || !d?.long?.length) return this.noData();
    const strips = g['strips-per-layer']; const reshape = v => Array.from({ length: g.layers }, (_, l) => v.slice(l * strips, (l + 1) * strips));
    const delta = d.recent.map((v, i) => v - d.long[i]);
    return { data: [
      { type: 'heatmap', z: reshape(d.long), colorscale: 'Viridis', name: 'Long window', colorbar: { title: 'Long', x: 0.275, thickness: 8 }, xaxis: 'x', yaxis: 'y' },
      { type: 'heatmap', z: reshape(d.recent), colorscale: 'Viridis', name: 'Recent', colorbar: { title: 'Recent', x: 0.64, thickness: 8 }, xaxis: 'x2', yaxis: 'y2' },
      { type: 'heatmap', z: reshape(delta), colorscale: 'RdBu', zmid: 0, name: 'Change', colorbar: { title: 'Δ', x: 1.02, thickness: 8 }, xaxis: 'x3', yaxis: 'y3' },
    ], layout: { ...this.baseLayout(), margin: { t: 32, r: 54, l: 46, b: 48 }, showlegend: false, xaxis: { title: 'Strip', domain: [0, 0.25] }, yaxis: { title: 'Layer', dtick: 1 }, xaxis2: { title: 'Strip', domain: [0.38, 0.63] }, yaxis2: { title: 'Layer', dtick: 1, anchor: 'x2' }, xaxis3: { title: 'Strip', domain: [0.75, 1] }, yaxis3: { title: 'Layer', dtick: 1, anchor: 'x3' } } };
  }
}
