import AtarPlot from './AtarPlot';
export default class AtarHitsPerEventPlot extends AtarPlot {
  static displayName = 'ATAR Hits per Event'; static name = 'AtarHitsPerEventPlot'; static viewName = 'hits-per-event';
  makePlot(p) { const d = p?.data; if (!d?.counts?.length) return this.noData(); const x = d.edges?.slice(0, d.counts.length) ?? d.counts.map((_, i) => i); const layout = this.baseLayout('Hits in one event', 'Number of events'); if (d['overflow-bin'] != null) layout.annotations = [{ text: `Last bin includes ≥${d['overflow-bin']} hits`, x: 0.02, y: 0.98, xref: 'paper', yref: 'paper', xanchor: 'left', showarrow: false }]; return { data: [{ type: 'bar', x, y: d.counts, marker: { color: '#2563eb' } }], layout }; }
}
