import AtarPlot from './AtarPlot';
export default class AtarWaveformsPlot extends AtarPlot {
  static displayName = 'ATAR Waveforms'; static name = 'AtarWaveformsPlot'; static viewName = 'waveforms';
  makePlot(p) { const w = p?.data?.waveforms; if (!w?.length) return this.noData(); return { data: w.map(x => ({ type: 'scatter', mode: 'lines', x: x.samples.map((_, i) => i * 0.3125), y: x.samples, name: `L${x.layer} S${x.strip}` })), layout: this.plotLayout('Time (ns)', 'Voltage (V)', { showLegend: true, topMargin: 52, rightMargin: 36 }) }; }
}
