jest.mock('../../PlotlyComponent', () => () => null);

import HdSocPulseIntegralPlot from './HdSocPulseIntegralPlot';
import MusipPulseIntegralPlot from './MusipPulseIntegralPlot';
import SampicPulseIntegralPlot from './SampicPulseIntegralPlot';
import Wfd5PulseIntegralPlot from './Wfd5PulseIntegralPlot';

describe('detector pulse-integral plots', () => {
  test('select global detector histograms explicitly', () => {
    const plot = new Wfd5PulseIntegralPlot({ id: 'global', settings: { scope: 'global' } });
    expect(plot.getHistogramName()).toBe('PulseIntegrals/wfd5/global/pulse_integral');
  });

  test.each([
    [SampicPulseIntegralPlot, { scope: 'channel', crate: 1, feb: 2, chip: 3, channel: 4 },
      'PulseIntegrals/sampic/module-6/submodule-3/channel-4/pulse_integral'],
    [HdSocPulseIntegralPlot, { scope: 'channel', board: 2, channel: 5 },
      'PulseIntegrals/hdsoc/module-2/submodule-0/channel-5/pulse_integral'],
    [Wfd5PulseIntegralPlot, { scope: 'channel', crate: 3, amc: 4, channel: 6 },
      'PulseIntegrals/wfd5/module-3/submodule-4/channel-6/pulse_integral'],
    [MusipPulseIntegralPlot, { scope: 'channel', group: 1, channel: 7 },
      'PulseIntegrals/musip/module-1/submodule-0/channel-7/pulse_integral'],
  ])('%p builds the selected channel path', (PlotClass, settings, expected) => {
    const plot = new PlotClass({ id: 'channel', settings });
    expect(plot.getHistogramName()).toBe(expected);
    expect(new URL(plot.getDataUrl()).searchParams.get('name')).toBe(expected);
  });
});
