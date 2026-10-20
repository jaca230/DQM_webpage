import AtarPlot from './AtarPlot';
export default class AtarHitsPerEventPlot extends AtarPlot {
  static displayName = 'ATAR Hits per Event'; static name = 'AtarHitsPerEventPlot'; static viewName = 'hits-per-event';
  makePlot(p) { const d = p?.data; if (!d?.counts?.length) return this.noData(); return { data: [{ type: 'bar', x: d.counts.map((_, i) => i), y: d.counts, marker: { color: '#2563eb' } }], layout: this.baseLayout('Hits per event', 'Events') }; }
}
