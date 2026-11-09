import Plot from '../Plot';

export default class TestBeamPlot extends Plot {
  plotLayout(xTitle, yTitle, options = {}) {
    const {
      rightMargin = 28,
      topMargin = 28,
      showLegend = false,
    } = options;
    return {
      autosize: true,
      margin: { t: topMargin, r: rightMargin, l: 72, b: 62 },
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#f8fafc',
      font: { color: '#172033' },
      xaxis: {
        title: { text: xTitle, standoff: 12 },
        automargin: true,
        gridcolor: '#dbe3ee',
        zerolinecolor: '#94a3b8',
      },
      yaxis: {
        title: { text: yTitle, standoff: 12 },
        automargin: true,
        gridcolor: '#dbe3ee',
        zerolinecolor: '#94a3b8',
      },
      showlegend: showLegend,
    };
  }

  emptyAnnotation(text) {
    return {
      text,
      x: 0.5,
      y: 0.5,
      xref: 'paper',
      yref: 'paper',
      showarrow: false,
      font: { color: '#64748b', size: 16 },
      bgcolor: 'rgba(255,255,255,0.9)',
      borderpad: 6,
    };
  }

  marginAnnotation(text) {
    return {
      text,
      x: 0,
      y: 1.06,
      xref: 'paper',
      yref: 'paper',
      xanchor: 'left',
      yanchor: 'bottom',
      showarrow: false,
      font: { color: '#475569', size: 11 },
      bgcolor: '#ffffff',
      borderpad: 2,
    };
  }
}
