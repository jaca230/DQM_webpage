import Plot from './Plot';
import SettingTypes from '../../enums/SettingTypes';

export default class WFD5WaveformTraceOnlyTest extends Plot {
  static displayName = 'WFD5 Waveform (Trace Only) Test';
  static name = 'WFD5WaveformTraceOnlyTest';

  static get settingSchema() {
    return {
      ...super.settingSchema,
      // Detector selection
      detectorSystem: {
        type: SettingTypes.STRING,
        default: '',
        label: 'Detector System',
        onChange: 'onUpdateTick',
      },
      subdetector: {
        type: SettingTypes.STRING,
        default: '',
        label: 'Subdetector',
        onChange: 'onUpdateTick',
      },

      // Channel fallback
      crate: {
        type: SettingTypes.INT,
        default: 0,
        label: 'Crate #',
        onChange: 'onUpdateTick',
      },
      amcSlot: {
        type: SettingTypes.INT,
        default: 0,
        label: 'AMC Slot #',
        onChange: 'onUpdateTick',
      },
      channel: {
        type: SettingTypes.INT,
        default: 0,
        label: 'Channel #',
        onChange: 'onUpdateTick',
      },

      // Data URL (override the default from Figure)
      dataUrl: {
        type: SettingTypes.STRING,
        default:
          'http://127.0.0.1:3000/api/json_path?last=1&json_path=/data_products/WFD5WaveformCollection',
        label: 'Data URL',
        onChange: 'onUpdateTick',
        advanced: true,
      },

      // Basic trace style
      traceColor: {
        type: SettingTypes.COLOR,
        default: 'rgba(70,130,180,1)', // steelblue
        label: 'Trace Color',
        onChange: 'onLayoutUpdate',
        advanced: false,
      },
    };
  }

  initPlot(raw) {
    const trace = this.buildTrace(raw);
    return {
      data: trace ? [trace] : [],
      layout: {
        autosize: true,
        margin: { t: 30, r: 20, l: 40, b: 40 },
        xaxis: { title: 'Sample Number' },
        yaxis: { title: 'ADC Value' },
        legend: { orientation: 'h', y: -0.2 },
      },
    };
  }

  updatePlot(raw) {
    const trace = this.buildTrace(raw);
    return {
      data: trace ? [trace] : [],
      layout: undefined, // Don't update layout on data updates
    };
  }

  buildTrace(raw) {
    const list = raw?.data?.arr;
    if (!Array.isArray(list)) return null;

    const s = this.settings;

    let wf = null;
    let settingsToUpdate = {};

    // Try detector/subdetector first
    if (s.detectorSystem && s.subdetector) {
      wf = list.find(
        w =>
          w.detectorSystem === s.detectorSystem &&
          w.subdetector === s.subdetector &&
          Array.isArray(w.trace)
      );

      if (wf) {
        // Update crate/amc/channel from matched item
        if (wf.crateNum != null && s.crate !== wf.crateNum) {
          settingsToUpdate.crate = wf.crateNum;
        }
        if (wf.amcNum != null && s.amcSlot !== wf.amcNum) {
          settingsToUpdate.amcSlot = wf.amcNum;
        }
        if (wf.channelTag != null && s.channel !== wf.channelTag) {
          settingsToUpdate.channel = wf.channelTag;
        }
      }
    }

    // Fallback to crate/amc/channel
    if (!wf) {
      wf = list.find(
        w =>
          w.crateNum === s.crate &&
          w.amcNum === s.amcSlot &&
          w.channelTag === s.channel &&
          Array.isArray(w.trace)
      );

      if (wf) {
        // Update detector/subdetector from matched item
        if (wf.detectorSystem && s.detectorSystem !== wf.detectorSystem) {
          settingsToUpdate.detectorSystem = wf.detectorSystem;
        }
        if (wf.subdetector && s.subdetector !== wf.subdetector) {
          settingsToUpdate.subdetector = wf.subdetector;
        }
      }
    }

    // Only update settings if there are actual changes
    if (Object.keys(settingsToUpdate).length > 0 && typeof this.props.onSettingsCorrected === 'function') {
      const newSettings = { ...s, ...settingsToUpdate };
      console.log(`[${this.id || 'WFD5TraceTest'}] Auto-syncing settings:`, settingsToUpdate);
      // Use setTimeout to avoid updating during render
      setTimeout(() => this.props.onSettingsCorrected(newSettings), 0);
    }

    if (!wf) return null;

    return {
      type: 'scatter',
      mode: 'lines',
      x: wf.trace.map((_, i) => i),
      y: wf.trace,
      name: wf.detectorSystem || `Crate ${s.crate}, AMC ${s.amcSlot}, Ch ${s.channel}`,
      line: { color: s.traceColor },
      hoverinfo: 'x+y+name',
    };
  }
}