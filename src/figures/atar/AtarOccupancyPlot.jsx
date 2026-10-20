import AtarPlot from './AtarPlot';
export default class AtarOccupancyPlot extends AtarPlot {
  static displayName = 'ATAR Occupancy'; static name = 'AtarOccupancyPlot'; static viewName = 'occupancy';
  makePlot(p) {
    const g = p?.geometry; const counts = p?.data?.counts;
    if (!g || !Array.isArray(counts)) return this.noData();
    const strips = g['strips-per-layer']; const layers = g.layers;
    const z = Array.from({ length: layers }, (_, l) => counts.slice(l * strips, (l + 1) * strips));
    const layout = this.baseLayout('Strip', 'Layer'); layout.margin.r = 76; layout.yaxis = { ...layout.yaxis, dtick: 1 };
    return { data: [{ type: 'heatmap', z, colorscale: 'Viridis', colorbar: { title: 'Hits', thickness: 12, x: 1.02 } }], layout };
  }
}
