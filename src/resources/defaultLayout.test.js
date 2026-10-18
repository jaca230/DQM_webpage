import defaultLayout from './defaultLayout.json';

describe('default layout', () => {
  test('contains the detector waveforms and four pulse-integral histograms', () => {
    const figureTypes = defaultLayout.tabs.flatMap((tab) => (
      tab.figures.map((figure) => figure.type)
    ));

    expect(figureTypes).toEqual([
      'Label',
      'SampicWaveformPlot',
      'HdSocWaveformPlot',
      'Wfd5WaveformPlot',
      'MuSipHitPlot',
      'HistogramPlot',
      'HistogramPlot',
      'HistogramPlot',
      'HistogramPlot',
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

  test('selects histograms produced by the online Gaudi pipeline', () => {
    const names = defaultLayout.tabs[1].figures.map(
      (figure) => figure.settings.histogramName
    );
    expect(names).toEqual([
      'PulseIntegrals/sampic_pulse_integral',
      'PulseIntegrals/hdsoc_pulse_integral',
      'PulseIntegrals/wfd5_pulse_integral',
      'PulseIntegrals/musip_pulse_integral',
    ]);
  });
});
