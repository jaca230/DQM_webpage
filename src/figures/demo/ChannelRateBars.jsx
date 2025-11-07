import Plot from '../plots/Plot';
import SettingTypes from '../../enums/SettingTypes';

const CHANNELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default class ChannelRateBars extends Plot {
  static displayName = 'DAQ • Channel Rates';
  static name = 'ChannelRateBars';

  constructor(props) {
    super(props);
    this.channelState = CHANNELS.map((name, idx) => ({
      name,
      rate: 45 + idx * 5 + Math.random() * 10,
    }));
  }

  static get settingSchema() {
    const base = super.settingSchema || {};
    return {
      ...base,
      dataUrl: {
        ...(base.dataUrl || {}),
        default: 'None',
        label: 'Data URL (unused)',
        advanced: true,
      },
      updateFrequency: {
        ...(base.updateFrequency || {}),
        default: 0.9,
        label: 'Refresh Interval (s)',
        onChange: 'onUpdateFrequencyChange',
      },
      highlightedChannel: {
        type: SettingTypes.STRING,
        default: 'B1',
        label: 'Highlight Channel',
      },
    };
  }

  getDataUrl() {
    return 'None';
  }

  initPlot() {
    return this.buildPlot(true);
  }

  updatePlot() {
    return this.buildPlot(false);
  }

  buildPlot(includeLayout) {
    this.channelState = this.channelState.map((ch) => {
      const drift = (Math.random() - 0.5) * 3.5;
      const rate = Math.max(15, Math.min(120, ch.rate + drift));
      return { ...ch, rate };
    });

    const highlight = (this.settings.highlightedChannel || '').toUpperCase();

    return {
      data: [
        {
          type: 'bar',
          x: this.channelState.map((ch) => ch.name),
          y: this.channelState.map((ch) => +(ch.rate.toFixed(1))),
          marker: {
            color: this.channelState.map((ch) =>
              ch.name.toUpperCase() === highlight ? '#f97316' : '#38bdf8'
            ),
          },
          hovertemplate: 'Channel %{x}: %{y} MB/s<extra></extra>',
        },
      ],
      layout: includeLayout
        ? {
            margin: { t: 40, r: 20, b: 40, l: 45 },
            yaxis: { title: 'Data Rate (MB/s)', range: [0, 130] },
            xaxis: { title: 'Channel', tickfont: { size: 12 } },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
          }
        : undefined,
    };
  }
}
