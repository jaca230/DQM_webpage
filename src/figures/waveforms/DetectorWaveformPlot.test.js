jest.mock('../plots/PlotlyComponent', () => () => null);

import HdSocWaveformPlot from './HdSocWaveformPlot';
import MuSipHitPlot from '../hits/MuSipHitPlot';
import SampicWaveformPlot from './SampicWaveformPlot';
import Wfd5WaveformPlot from './Wfd5WaveformPlot';

describe('live detector waveform plots', () => {
  const useSynchronousState = (component) => {
    component.setState = (update, callback) => {
      const change = typeof update === 'function' ? update(component.state) : update;
      component.state = { ...component.state, ...change };
      callback?.();
    };
  };

  test('never invents samples when no matching live waveform exists', () => {
    const plot = new SampicWaveformPlot({
      id: 'sampic',
      settings: { crate: 0, feb: 0, chip: 0, channel: 0 },
    });

    expect(plot.buildTraces(null)).toEqual([]);
    expect(plot.buildTraces({ detector: 'sampic', waveforms: [] })).toEqual([]);
    expect(plot.statusAnnotations([])[0].text).toBe('No live data found');
    expect(SampicWaveformPlot.settingSchema).not.toHaveProperty('samplePeriodNs');
    expect(SampicWaveformPlot.settingSchema).not.toHaveProperty('sampleCount');
  });

  test('uses bounded SVG traces rather than a WebGL context', () => {
    const plot = new SampicWaveformPlot({
      id: 'sampic',
      settings: { crate: 0, feb: 0, chip: 0, channel: 0 },
    });
    const traces = plot.buildTraces({
      detector: 'sampic',
      waveforms: [{ module: 0, submodule: 0, channel: 0, samples: [1, 2, 3] }],
    });
    expect(traces[0].type).toBe('scatter');
  });

  test('retains the last valid trace when a later response is empty or unavailable', () => {
    const plot = new SampicWaveformPlot({
      id: 'sampic',
      settings: { crate: 0, feb: 0, chip: 0, channel: 0 },
    });
    useSynchronousState(plot);
    plot._updatePlotInternal({
      detector: 'sampic',
      waveforms: [{ module: 0, submodule: 0, channel: 0, sequence: 7, samples: [1, 4, 2] }],
    });
    const retainedData = plot.state.data;
    const retainedTimestamp = plot.state.lastDataAt;

    plot._updatePlotInternal({ detector: 'sampic', waveforms: [] });
    plot.handleUnavailableData();

    expect(plot.state.data).toBe(retainedData);
    expect(plot.state.lastDataAt).toBe(retainedTimestamp);
    expect(plot.state.error).toBeNull();
  });

  test('does not refresh the displayed age for a repeated cached sequence', () => {
    const plot = new SampicWaveformPlot({
      id: 'sampic',
      settings: { crate: 0, feb: 0, chip: 0, channel: 0 },
    });
    useSynchronousState(plot);
    const payload = {
      detector: 'sampic',
      waveforms: [{ module: 0, submodule: 0, channel: 0, sequence: 7, samples: [1, 4, 2] }],
    };

    plot._updatePlotInternal(payload);
    const firstTimestamp = plot.state.lastDataAt;
    plot._updatePlotInternal(payload);
    expect(plot.state.lastDataAt).toBe(firstTimestamp);

    plot._updatePlotInternal({
      ...payload,
      waveforms: [{ ...payload.waveforms[0], sequence: 8, samples: [2, 5, 3] }],
    });
    expect(plot.state.lastDataVersion).toContain('8');
  });

  test('renders MuSiP as timed hit-energy markers', () => {
    const plot = new MuSipHitPlot({ id: 'musip', settings: { group: 0, channel: 0 } });
    const traces = plot.buildTraces({
      detector: 'musip',
      'hit-series': [{ 'times-ns': [100, 108], energies: [12, 20] }],
    });
    expect(traces[0]).toMatchObject({
      type: 'scatter', mode: 'markers', x: [100, 108], y: [12, 20],
    });
  });

  test('maps detector-specific coordinates onto the gateway query', () => {
    const sampic = new SampicWaveformPlot({
      id: 'sampic',
      settings: {
        crate: 2,
        feb: 3,
        chip: 1,
        channel: 7,
        maximumSamples: 128,
      },
    });
    const wfd5 = new Wfd5WaveformPlot({
      id: 'wfd5',
      settings: { crate: 4, amc: 2, channel: 1, maximumSamples: 512 },
    });

    expect(Object.fromEntries(new URL(sampic.getDataUrl()).searchParams)).toMatchObject({
      module: '11',
      submodule: '1',
      channel: '7',
      'max-samples': '128',
    });
    expect(Object.fromEntries(new URL(wfd5.getDataUrl()).searchParams)).toMatchObject({
      module: '4',
      submodule: '2',
      channel: '1',
      'max-samples': '512',
    });
  });

  test('uses the known simulator coordinates as defaults', () => {
    const hdsoc = new HdSocWaveformPlot({ id: 'hdsoc', settings: {} });
    const musip = new MuSipHitPlot({ id: 'musip', settings: {} });
    const wfd5 = new Wfd5WaveformPlot({ id: 'wfd5', settings: { channel: 1 } });

    expect(hdsoc.getSelection()).toEqual({ module: 0, submodule: 0, channel: 0 });
    expect(Object.fromEntries(new URL(musip.getDataUrl()).searchParams)).toMatchObject({
      detector: 'musip', module: '0', submodule: '0', channel: '0',
    });
    expect(wfd5.getSelection()).toEqual({ module: 0, submodule: 1, channel: 1 });
  });
});
