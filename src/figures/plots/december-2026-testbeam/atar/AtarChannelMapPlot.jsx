import React from 'react';
import AtarPlot from './AtarPlot';

export default class AtarChannelMapPlot extends AtarPlot {
  renderPlotCaption() {
    return (
      <div className="figure-plot-caption">
        Gray cells had no waveform samples in that time window and are excluded from the color scale.
      </div>
    );
  }

  makePlot(p) {
    const g = p?.geometry;
    const d = p?.data;
    if (!g || !d?.long?.length) return this.noData();
    const strips = g['strips-per-layer'];
    const reshape = values => Array.from(
      { length: g.layers },
      (_, layer) => values.slice(layer * strips, (layer + 1) * strips),
    );
    const counts = (name, values) => {
      const supplied = d[`${name}-counts`];
      return supplied?.length === values.length
        ? supplied
        : values.map((value) => Number.isFinite(value) ? 1 : 0);
    };
    const longCounts = counts('long', d.long);
    const recentCounts = counts('recent', d.recent);
    const maskMissing = (values, observations) => values.map(
      (value, index) => observations[index] > 0 && Number.isFinite(value) ? value : null,
    );
    const longValues = maskMissing(d.long, longCounts);
    const recentValues = maskMissing(d.recent, recentCounts);
    const deltaCounts = recentCounts.map(
      (count, index) => count > 0 && longCounts[index] > 0 ? 1 : 0,
    );
    const deltaValues = maskMissing(
      d.recent.map((value, index) => value - d.long[index]),
      deltaCounts,
    );
    const valueTitle = this.constructor.valueTitle || 'Value';
    const layout = this.plotLayout('Strip', 'Layer', { topMargin: 54, rightMargin: 88 });
    const xaxis = { ...layout.xaxis, dtick: 8 };
    const yaxis = { ...layout.yaxis, dtick: 1 };
    const colorbar = (title, x) => ({
      title: { text: title, side: 'top' },
      x,
      xanchor: 'left',
      thickness: 8,
    });
    const missingTrace = (observations, xaxis, yaxis) => ({
      type: 'heatmap',
      z: reshape(observations.map((count) => count > 0 ? null : 1)),
      colorscale: [[0, '#cbd5e1'], [1, '#cbd5e1']],
      zmin: 0,
      zmax: 1,
      showscale: false,
      hovertemplate: 'No samples observed<extra></extra>',
      hoverongaps: false,
      xaxis,
      yaxis,
    });
    const valueTrace = (values, title, colorscale, xaxis, yaxis, x, extra = {}) => ({
      type: 'heatmap',
      z: reshape(values),
      colorscale,
      colorbar: colorbar(title, x),
      showscale: values.some((value) => value !== null),
      hoverongaps: false,
      xaxis,
      yaxis,
      ...extra,
    });
    return {
      data: [
        missingTrace(longCounts, 'x', 'y'),
        valueTrace(longValues, valueTitle, 'Viridis', 'x', 'y', 0.245),
        missingTrace(recentCounts, 'x2', 'y2'),
        valueTrace(recentValues, valueTitle, 'Viridis', 'x2', 'y2', 0.635),
        missingTrace(deltaCounts, 'x3', 'y3'),
        valueTrace(deltaValues, `Δ ${valueTitle}`, 'RdBu', 'x3', 'y3', 1.015, { zmid: 0 }),
      ],
      layout: {
        ...layout,
        showlegend: false,
        xaxis: { ...xaxis, domain: [0, 0.22] },
        yaxis,
        xaxis2: { ...xaxis, domain: [0.39, 0.61], anchor: 'y2' },
        yaxis2: { ...yaxis, anchor: 'x2' },
        xaxis3: { ...xaxis, domain: [0.78, 1], anchor: 'y3' },
        yaxis3: { ...yaxis, anchor: 'x3' },
        annotations: [
          { ...this.marginAnnotation('Long window'), x: 0.11, xanchor: 'center' },
          { ...this.marginAnnotation('Recent window'), x: 0.50, xanchor: 'center' },
          { ...this.marginAnnotation('Recent − long'), x: 0.89, xanchor: 'center' },
        ],
      },
    };
  }
}
