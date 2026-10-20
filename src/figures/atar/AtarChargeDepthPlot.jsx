import AtarPlot from './AtarPlot';
export default class AtarChargeDepthPlot extends AtarPlot {
  static displayName = 'ATAR Charge Depth'; static name = 'AtarChargeDepthPlot'; static viewName = 'event';
  makePlot(p) { const q = p?.data?.['charge-by-layer']; if (!q?.length) return this.noData(); const total = q.reduce((a, b) => a + b, 0); return { data: [{ type: 'bar', x: q.map((_, i) => i), y: q, marker: { color: '#7c3aed' } }], layout: { ...this.baseLayout('Layer', 'Charge (V·samples)'), annotations: [{ text: `Total: ${total.toFixed(2)} V·samples`, x: 0.98, y: 0.98, xref: 'paper', yref: 'paper', xanchor: 'right', showarrow: false }] } }; }
}
