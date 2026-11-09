jest.mock('../../PlotlyComponent', () => () => null);

import AtarHitPositionsPlot from './AtarHitPositionsPlot';

describe('ATAR hit-position plot', () => {
  test('separates alternating X and Y detector layers into labeled projections', () => {
    const plot = new AtarHitPositionsPlot({ id: 'atar-hits', settings: {} });
    const result = plot.makePlot({
      data: {
        hits: [
          { layer: 0, strip: 11, channel: 11, charge: 3 },
          { layer: 1, strip: 19, channel: 51, charge: 4 },
          { layer: 2, strip: 12, channel: 76, charge: 2 },
          { layer: 3, strip: 18, channel: 114, charge: 5 },
        ],
      },
    });

    const xHits = result.data.find(trace => trace.xaxis === 'x' && trace.mode === 'markers');
    const yHits = result.data.find(trace => trace.xaxis === 'x2' && trace.mode === 'markers');
    expect(xHits.x).toEqual([11, 12]);
    expect(xHits.y).toEqual([0, 2]);
    expect(yHits.x).toEqual([19, 18]);
    expect(yHits.y).toEqual([1, 3]);
    expect(result.layout.xaxis.title.text).toBe('X strip');
    expect(result.layout.xaxis2.title.text).toBe('Y strip');
    expect(result.layout.yaxis.title.text).toBe('X layers');
    expect(result.layout.yaxis2.title.text).toBe('Y layers');
    expect(result.layout.annotations.every(({ y }) => y > 1)).toBe(true);
  });

  test('keeps observable time groups distinct without inventing connected tracks', () => {
    const plot = new AtarHitPositionsPlot({ id: 'atar-hits', settings: {} });
    const result = plot.makePlot({ data: { hits: [
      { layer: 0, strip: 10, channel: 10, charge: 3, 'time-ns': 100, 'time-group': 0 },
      { layer: 2, strip: 11, channel: 75, charge: 3, 'time-ns': 102, 'time-group': 0 },
      { layer: 0, strip: 20, channel: 20, charge: 2, 'time-ns': 2200, 'time-group': 1 },
      { layer: 2, strip: 18, channel: 82, charge: 2, 'time-ns': 2202, 'time-group': 1 },
    ] } });

    expect(result.data.some(trace => trace.mode.includes('lines'))).toBe(false);
    const groups = result.data.filter(trace => trace.xaxis === 'x');
    expect(groups).toHaveLength(2);
    expect(groups.map(trace => trace.name)).toEqual([
      'Time group 0 (Δt 0.0 ns)', 'Time group 1 (Δt 2100.0 ns)',
    ]);
  });
});
