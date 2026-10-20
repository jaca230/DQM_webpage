import AtarPlot from './AtarPlot';
export default class AtarHitPositionsPlot extends AtarPlot {
  static displayName = 'ATAR Hit Positions'; static name = 'AtarHitPositionsPlot'; static viewName = 'hit-positions';
  makePlot(p) { const hits = p?.data?.hits; if (!hits?.length) return this.noData(); const layout = this.baseLayout('Strip', 'Layer'); layout.margin.r = 76; layout.xaxis = { ...layout.xaxis, range: [-0.5, 31.5], dtick: 2 }; layout.yaxis = { ...layout.yaxis, range: [-0.5, 7.5], dtick: 1 }; return { data: [{ type: 'scatter', mode: 'markers', x: hits.map(x => x.strip), y: hits.map(x => x.layer), marker: { size: hits.map(x => Math.min(18, 6 + Math.sqrt(Math.max(0, x.charge)))), color: hits.map(x => x.charge), colorscale: 'Viridis', showscale: true, colorbar: { title: 'Charge', thickness: 12, x: 1.02 } }, text: hits.map(x => `Channel ${x.channel}`), hovertemplate: '%{text}<br>Strip %{x}, layer %{y}<extra></extra>' }], layout }; }
}
