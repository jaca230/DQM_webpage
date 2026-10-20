import AtarPlot from './AtarPlot';
export default class AtarChargeDepthPlot extends AtarPlot {
  static displayName = 'ATAR Charge Depth'; static name = 'AtarChargeDepthPlot'; static viewName = 'charge-depth';
  makePlot(p) { const q = p?.data?.['charge-by-layer']; if (!q?.length) return this.noData(); const total = p?.data?.['total-charge'] ?? q.reduce((a, b) => a + b, 0); const layout = this.baseLayout('Layer', 'Charge (V·samples)'); layout.xaxis = { ...layout.xaxis, range: [-0.5, q.length - 0.5], dtick: 1 }; layout.annotations = [{ text: `Total: ${total.toFixed(2)} V·samples`, x: 0.02, y: 0.98, xref: 'paper', yref: 'paper', xanchor: 'left', showarrow: false }]; return { data: [{ type: 'bar', x: q.map((_, i) => i), y: q, marker: { color: '#7c3aed' } }], layout }; }
}
