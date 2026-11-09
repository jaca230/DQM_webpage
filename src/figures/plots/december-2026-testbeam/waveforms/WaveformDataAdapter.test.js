import WaveformDataAdapter from './WaveformDataAdapter';

describe('WaveformDataAdapter', () => {
  test('selects a canonical detector waveform', () => {
    const payload = {
      detector: 'sampic',
      waveforms: [
        { module: 1, channel: 3, samples: [10, 11, 12] },
        { module: 1, channel: 4, samples: [20, 21, 22] },
      ],
    };

    const waveform = WaveformDataAdapter.find(payload, {
      detector: 'sampic',
      module: 1,
      channel: 4,
    });

    expect(WaveformDataAdapter.samples(waveform)).toEqual([20, 21, 22]);
  });

  test('accepts the existing WFD5 collection shape', () => {
    const payload = {
      data: {
        arr: [{ crateNum: 2, amcNum: 0, channelTag: 7, trace: [4, 5, 6] }],
      },
    };

    const waveform = WaveformDataAdapter.find(payload, {
      detector: 'wfd5',
      module: 2,
      channel: 7,
    });

    expect(WaveformDataAdapter.samples(waveform)).toEqual([4, 5, 6]);
  });

  test('does not route a waveform from another detector', () => {
    const payload = {
      waveforms: [{ detector: 'hdsoc', module: 0, channel: 0, samples: [1] }],
    };

    expect(WaveformDataAdapter.find(payload, {
      detector: 'musip',
      module: 0,
      channel: 0,
    })).toBeNull();
  });

  test('preserves explicit hit-series times', () => {
    const waveform = { samples: [3, 5], 'times-ns': [100, 108] };
    expect(WaveformDataAdapter.times(waveform)).toEqual([100, 108]);
  });
});
