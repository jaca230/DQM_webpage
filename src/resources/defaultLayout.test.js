import defaultLayout from './defaultLayout.json';

describe('default layout', () => {
  test('contains detector, pulse-integral, and ATAR monitoring figures', () => {
    const figureTypes = defaultLayout.tabs.flatMap((tab) => (
      tab.figures.map((figure) => figure.type)
    ));

    expect(figureTypes).toEqual([
      'Label',
      'SampicWaveformPlot',
      'HdSocWaveformPlot',
      'Wfd5WaveformPlot',
      'MuSipHitPlot',
      'SampicPulseIntegralPlot',
      'HdSocPulseIntegralPlot',
      'Wfd5PulseIntegralPlot',
      'MusipPulseIntegralPlot',
      'SampicPulseIntegralPlot',
      'HdSocPulseIntegralPlot',
      'Wfd5PulseIntegralPlot',
      'MusipPulseIntegralPlot',
      'AtarOccupancyPlot',
      'AtarHitsPerEventPlot',
      'AtarBaselinePlot',
      'AtarNoisePlot',
      'AtarWaveformsPlot',
      'AtarHitPositionsPlot',
      'AtarChargeDepthPlot',
      'AtarPersistencePlot',
      'AtarChargeVsAmplitudePlot',
      'AtarAmplitudeByChannelPlot',
    ]);
    expect(defaultLayout.tabs.flatMap((tab) => tab.figures.map(({ id }) => id)))
      .toHaveLength(new Set(defaultLayout.tabs.flatMap((tab) => tab.figures.map(({ id }) => id))).size);
  });

  test('has one layout entry for every figure', () => {
    for (const tab of defaultLayout.tabs) {
      expect(tab.layout.map(({ id }) => id).sort()).toEqual(
        tab.figures.map(({ id }) => id).sort()
      );
    }
  });

  test('selects channels produced by the mixed-detector simulator', () => {
    const figures = Object.fromEntries(
      defaultLayout.tabs[0].figures.map((figure) => [figure.type, figure.settings])
    );

    expect(figures.SampicWaveformPlot).toMatchObject({
      crate: 0, feb: 0, chip: 0, channel: 0,
    });
    expect(figures.HdSocWaveformPlot).toMatchObject({ board: 0, channel: 0 });
    expect(figures.Wfd5WaveformPlot).toMatchObject({ crate: 0, amc: 1, channel: 1 });
    expect(figures.MuSipHitPlot).toMatchObject({ group: 0, channel: 0 });
  });

  test('starts detector pulse-integral plots with explicit global scope', () => {
    expect(defaultLayout.tabs[1].figures.map((figure) => figure.settings.scope))
      .toEqual(['global', 'global', 'global', 'global']);
  });

  test('provides populated simulator examples in a separate channel-integral tab', () => {
    expect(defaultLayout.tabs[1].name).toBe('Pulse Integrals: Global');
    expect(defaultLayout.tabs[2].name).toBe('Pulse Integrals: Channels');

    const figures = Object.fromEntries(
      defaultLayout.tabs[2].figures.map((figure) => [figure.type, figure.settings])
    );
    expect(Object.values(figures).map(({ scope }) => scope))
      .toEqual(['channel', 'channel', 'channel', 'channel']);
    expect(figures.SampicPulseIntegralPlot).toMatchObject({
      crate: 0, feb: 0, chip: 0, channel: 12,
    });
    expect(figures.HdSocPulseIntegralPlot).toMatchObject({ board: 0, channel: 0 });
    expect(figures.Wfd5PulseIntegralPlot).toMatchObject({ crate: 0, amc: 1, channel: 1 });
    expect(figures.MusipPulseIntegralPlot).toMatchObject({ group: 0, channel: 0 });
  });
});
