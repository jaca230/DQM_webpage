jest.mock('../../PlotlyComponent', () => () => null);

import AtarBaselinePlot from './AtarBaselinePlot';

describe('ATAR channel metric maps', () => {
  test('distinguish missing observations from measured zero values', () => {
    const plot = new AtarBaselinePlot({ id: 'atar-baseline', settings: {} });
    const result = plot.makePlot({
      geometry: { layers: 2, 'strips-per-layer': 2 },
      data: {
        long: [0, 0.2, 0.3, 0],
        'long-counts': [4, 0, 2, 0],
        recent: [0, 0.25, 0, 0],
        'recent-counts': [1, 3, 0, 0],
      },
    });

    const longMissing = result.data[0];
    const longValues = result.data[1];
    const recentValues = result.data[3];
    const deltaValues = result.data[5];

    expect(longValues.z).toEqual([[0, null], [0.3, null]]);
    expect(longMissing.z).toEqual([[null, 1], [null, 1]]);
    expect(recentValues.z).toEqual([[0, 0.25], [null, null]]);
    expect(deltaValues.z).toEqual([[0, null], [null, null]]);
    expect(longValues.showscale).toBe(true);
    expect(longMissing.showscale).toBe(false);
  });
});
