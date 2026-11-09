import AtarPlot from './AtarPlot';
export default class AtarChargeDepthPlot extends AtarPlot {
  static displayName = 'ATAR Charge Depth'; static name = 'AtarChargeDepthPlot'; static viewName = 'charge-depth';
  makePlot(p) { const q = p?.data?.['charge-by-layer']; if (!q?.length) return this.noData(); const total = p?.data?.['total-charge'] ?? q.reduce((a, b) => a + b, 0); const layout = this.plotLayout('Layer', 'Charge (V·samples)'); layout.xaxis = { ...layout.xaxis, range: [-0.5, q.length - 0.5], dtick: 1 }; layout.meta = { totalCharge: total }; return { data: [{ type: 'bar', x: q.map((_, i) => i), y: q, marker: { color: '#7c3aed' } }], layout }; }

  renderPlotCaption() {
    const total = this.state.layout?.meta?.totalCharge;
    if (!Number.isFinite(total)) return null;
    return <div className="figure-plot-caption">Total: {total.toFixed(2)} V·samples</div>;
  }
}
