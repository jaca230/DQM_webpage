import AtarPlot from './AtarPlot';

export default class AtarHitPositionsPlot extends AtarPlot {
  static displayName = 'ATAR Hit Positions';
  static name = 'AtarHitPositionsPlot';
  static viewName = 'hit-positions';

  makePlot(payload) {
    const hits = payload?.data?.hits;
    if (!hits?.length) return this.noData();

    const symbols = ['circle', 'diamond', 'square', 'cross', 'triangle-up'];
    const earliestTime = Math.min(...hits.map(hit => Number(hit['time-ns'] ?? 0)));
    const groups = [...new Set(hits.map(hit => Number(hit['time-group'] ?? 0)))].sort((a, b) => a - b);
    const traces = [];
    const addProjection = (projectionHits, xaxis, yaxis, showLegend) => {
      groups.forEach((group, groupIndex) => {
        const selected = projectionHits.filter(hit => Number(hit['time-group'] ?? 0) === group);
        if (!selected.length) return;
        const groupTime = Math.min(...selected.map(hit => Number(hit['time-ns'] ?? earliestTime)));
        const relativeTime = groupTime - earliestTime;
        const groupLabel = groups.length === 1
          ? 'Frontend time group'
          : `Time group ${group} (Δt ${relativeTime.toFixed(1)} ns)`;
        traces.push({
          type: 'scatter',
          mode: 'markers',
          x: selected.map(({ strip }) => strip),
          y: selected.map(({ layer }) => layer),
          marker: {
            size: selected.map(({ charge }) => Math.min(18, 5 + Math.sqrt(Math.max(0, charge)))),
            color: selected.map(({ charge }) => Number(charge)),
            coloraxis: 'coloraxis',
            symbol: symbols[groupIndex % symbols.length],
            opacity: 0.78,
          },
          customdata: selected.map(hit => [
            hit.channel,
            Number(hit.charge),
            Number(hit['time-ns'] ?? earliestTime) - earliestTime,
          ]),
          hovertemplate: 'Channel %{customdata[0]}<br>Strip %{x}<br>Layer %{y}<br>Charge %{customdata[1]:.3g}<br>Δt %{customdata[2]:.2f} ns<extra></extra>',
          xaxis,
          yaxis,
          legendgroup: `time-${group}`,
          name: groupLabel,
          showlegend: showLegend,
        });
      });
    };
    addProjection(hits.filter(({ layer }) => layer % 2 === 0), 'x', 'y', true);
    addProjection(hits.filter(({ layer }) => layer % 2 === 1), 'x2', 'y2', false);

    const layout = this.plotLayout('X strip', 'Layer', {
      topMargin: 86,
      rightMargin: 90,
      showLegend: true,
    });
    const axis = {
      range: [-0.5, 31.5],
      dtick: 4,
      automargin: true,
    };
    const layerAxis = {
      range: [-0.5, 7.5],
      dtick: 2,
      automargin: true,
    };
    return {
      data: traces,
      layout: {
        ...layout,
        xaxis: { ...layout.xaxis, ...axis, domain: [0, 0.43] },
        yaxis: { ...layout.yaxis, ...layerAxis, title: { text: 'X layers', standoff: 12 } },
        xaxis2: {
          ...layout.xaxis,
          ...axis,
          domain: [0.55, 0.98],
          anchor: 'y2',
          title: { text: 'Y strip', standoff: 12 },
        },
        yaxis2: {
          ...layout.yaxis,
          ...layerAxis,
          anchor: 'x2',
          title: { text: 'Y layers', standoff: 12 },
        },
        coloraxis: {
          colorscale: 'Viridis',
          colorbar: { title: { text: 'Charge' }, thickness: 12 },
        },
        legend: { orientation: 'h', x: 0, y: 1.19, xanchor: 'left', yanchor: 'bottom' },
        annotations: [
          { ...this.marginAnnotation('X projection · even layers'), x: 0.215, y: 1.03, xanchor: 'center' },
          { ...this.marginAnnotation('Y projection · odd layers'), x: 0.765, y: 1.03, xanchor: 'center' },
        ],
      },
    };
  }
}
