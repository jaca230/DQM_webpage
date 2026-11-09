jest.mock('../../PlotlyComponent', () => () => null);

import HistogramPlot from './HistogramPlot';

describe('live histogram plot', () => {
  test('builds a bounded gateway query', () => {
    const plot = new HistogramPlot({
      id: 'histogram',
      settings: {
        histogramName: 'PulseIntegrals/wfd5/global/pulse_integral',
        baseline: 'operator-zero',
        maximumBins: 128,
      },
    });

    expect(Object.fromEntries(new URL(plot.getDataUrl()).searchParams)).toEqual({
      name: 'PulseIntegrals/wfd5/global/pulse_integral',
      'max-bins': '128',
      baseline: 'operator-zero',
    });
  });

  test('renders only real histogram payloads', () => {
    const plot = new HistogramPlot({ id: 'histogram', settings: {} });
    expect(plot.buildTraces(null)).toEqual([]);
    expect(plot.statusAnnotations([])[0].text).toBe('No live histogram found');

    const traces = plot.buildTraces({ edges: [1, 10, 100], counts: [3, 7] });
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({
      type: 'scatter',
      x: [1, 10, 100],
      y: [3, 7, 7],
    });
    expect(plot.settings.xAxisScale).toBe('linear');

    const logPlot = new HistogramPlot({ id: 'log-histogram', settings: { xAxisScale: 'log' } });
    expect(logPlot.buildTraces({ edges: [0, 10, 100], counts: [3, 7] })[0].x)
      .toEqual([1, 10, 100]);
  });
});
