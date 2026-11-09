import AtarPlot from './AtarPlot';
export default class AtarHitsPerEventPlot extends AtarPlot {
  static displayName = 'ATAR Hits per Event'; static name = 'AtarHitsPerEventPlot'; static viewName = 'hits-per-event';
  makePlot(p) { const d = p?.data; if (!d?.counts?.length) return this.noData(); const x = d.edges?.slice(0, d.counts.length) ?? d.counts.map((_, i) => i); const layout = this.plotLayout('Hits in one event', 'Number of events', { topMargin: 48 }); if (d['overflow-bin'] != null) layout.annotations = [this.marginAnnotation(`Last bin includes ≥${d['overflow-bin']} hits`)]; return { data: [{ type: 'bar', x, y: d.counts, marker: { color: '#2563eb' } }], layout }; }
}
