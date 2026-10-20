import AtarPlot from './AtarPlot';
export default class AtarHitPositionsPlot extends AtarPlot {
  static displayName = 'ATAR Hit Positions'; static name = 'AtarHitPositionsPlot'; static viewName = 'event';
  makePlot(p) { const w = p?.data?.waveforms; if (!w?.length) return this.noData(); return { data: [{ type: 'scatter', mode: 'markers', x: w.map(x => x.strip), y: w.map(x => x.layer), marker: { size: w.map(x => 7 + Math.sqrt(Math.abs(x.charge))), color: w.map(x => x.charge), colorscale: 'Viridis', showscale: true, colorbar: { title: 'Charge' } }, text: w.map(x => `Channel ${x.channel}`), hovertemplate: '%{text}<br>Strip %{x}, layer %{y}<extra></extra>' }], layout: this.baseLayout('Strip', 'Layer') }; }
}
