
import Figure from '../Figure';
import SettingTypes from '../../enums/SettingTypes';
import Plotly from 'react-plotly.js';


export default class WFD5Waveformtest extends Figure {
  static displayName = 'WFD5 Waveform test ';
  static name = 'WFD5Waveform test';

  static get settingSchema() {
    return {
      ...super.settingSchema,
      dataUrl: {
        type: SettingTypes.STRING,
        default:
          'http://127.0.0.1:8000/api/json_path?last=1&json_path=/data_products/WFD5WaveformCollection',
        label: 'Data URL',
        onChange: 'onUpdateTick',
        advanced: true,
      },
      traceColor: {
        type: SettingTypes.COLOR,
        default: 'rgba(70,130,180,1)',
        label: 'Trace Color',
        onChange: 'onLayoutUpdate',
      },
      detectorSystem: { type: SettingTypes.STRING, default: '', label: 'Detector System', onChange: 'onUpdateTick' },
      subdetector: { type: SettingTypes.STRING, default: '', label: 'Subdetector', onChange: 'onUpdateTick' },
      crate: { type: SettingTypes.INT, default: 0, label: 'Crate #', onChange: 'onUpdateTick' },
      amcSlot: { type: SettingTypes.INT, default: 0, label: 'AMC Slot #', onChange: 'onUpdateTick' },
      channel: { type: SettingTypes.INT, default: 0, label: 'Channel #', onChange: 'onUpdateTick' },
      showIntegralBounds: { type: SettingTypes.BOOLEAN, default: true, label: 'Show Integral Bounds', onChange: 'onLayoutUpdate' },
      showIntegralFill: { type: SettingTypes.BOOLEAN, default: true, label: 'Fill Integral Region', onChange: 'onLayoutUpdate' },
      showPedestal: { type: SettingTypes.BOOLEAN, default: true, label: 'Show Pedestal', onChange: 'onLayoutUpdate' },
      showPedestalStdev: { type: SettingTypes.BOOLEAN, default: false, label: 'Show Pedestal StdDev', onChange: 'onLayoutUpdate' },
      showIntegralInfoBox: { type: SettingTypes.BOOLEAN, default: true, label: 'Show Integral Info Box', onChange: 'onLayoutUpdate' },
      subtractPedestal: { type: SettingTypes.BOOLEAN, default: false, label: 'Subtract Pedestal', onChange: 'onLayoutUpdate' },
        fixYAxis: { type: SettingTypes.BOOLEAN, default: false, label: 'Fix Y Axis Range', onChange: 'onLayoutUpdate', advanced: true },
        yAxisMin: { type: SettingTypes.NUMBER, default: -2048, label: 'Y Axis Min', onChange: 'onLayoutUpdate', advanced: true },
        yAxisMax: { type: SettingTypes.NUMBER, default: 2048, label: 'Y Axis Max', onChange: 'onLayoutUpdate', advanced: true },
        fixXAxis: { type: SettingTypes.BOOLEAN, default: false, label: 'Fix X Axis Range', onChange: 'onLayoutUpdate', advanced: true },
        xAxisMin: { type: SettingTypes.NUMBER, default: 0, label: 'X Axis Min', onChange: 'onLayoutUpdate', advanced: true },
        xAxisMax: { type: SettingTypes.NUMBER, default: 2048, label: 'X Axis Max', onChange: 'onLayoutUpdate', advanced: true },
        pedestalLineColor: { type: SettingTypes.COLOR, default: 'black', label: 'Pedestal Line Color', onChange: 'onLayoutUpdate', advanced: true },
        pedestalLineWidth: { type: SettingTypes.NUMBER, default: 2, label: 'Pedestal Line Width', onChange: 'onLayoutUpdate', advanced: true },
        pedestalLineDash: { type: SettingTypes.STRING, default: 'dash', label: 'Pedestal Line Dash', onChange: 'onLayoutUpdate', advanced: true },
        pedestalStdevFillColor: { type: SettingTypes.COLOR, default: 'rgba(0,0,0,0.1)', label: 'Pedestal StdDev Fill Color', onChange: 'onLayoutUpdate', advanced: true },
        integralLineColor: { type: SettingTypes.COLOR, default: 'black', label: 'Integral Bound Line Color', onChange: 'onLayoutUpdate', advanced: true },
        integralLineWidth: { type: SettingTypes.NUMBER, default: 2, label: 'Integral Bound Line Width', onChange: 'onLayoutUpdate', advanced: true },
        integralLineDash: { type: SettingTypes.STRING, default: 'dash', label: 'Integral Bound Line Dash', onChange: 'onLayoutUpdate', advanced: true },
        integralFillColor: { type: SettingTypes.COLOR, default: 'rgba(100,150,255,0.15)', label: 'Integral Region Fill Color', onChange: 'onLayoutUpdate', advanced: true },
        showIntegralWindowText: { type: SettingTypes.BOOLEAN, default: false, label: 'Show Integral Window Text', onChange: 'onLayoutUpdate', advanced: true },
        integralInfoBoxBgColor: { type: SettingTypes.COLOR, default: 'rgba(255,255,255,0.8)', label: 'Info Box Background Color', onChange: 'onLayoutUpdate', advanced: true },
        integralInfoBoxBorderColor: { type: SettingTypes.COLOR, default: 'black', label: 'Info Box Border Color', onChange: 'onLayoutUpdate', advanced: true },
        integralInfoBoxX: { type: SettingTypes.NUMBER, default: 0.02, label: 'Integral Info Box X', onChange: 'onLayoutUpdate', advanced: true },
        integralInfoBoxY: { type: SettingTypes.NUMBER, default: 0.98, label: 'Integral Info Box Y', onChange: 'onLayoutUpdate', advanced: true },

    };
  }

    onDataReceived(waveformRaw) {
        if (!waveformRaw) return;
        const { data, layout } = this.formatPlotly(waveformRaw);
        this.setState(prev => ({ data, layout, revision: (prev.revision || 0) + 1 }));
    }

    onDataError(error) {
        this.setState({ error });
    }

  formatPlotly(waveformRaw) {
    const s = this.settings;
    const list = waveformRaw?.data?.arr;
    if (!list?.length) return { data: [], layout: { title: 'No waveform data', autosize: true } };

    const wfItem = list.find(
      item =>
        (s.detectorSystem && s.subdetector && item.detectorSystem === s.detectorSystem && item.subdetector === s.subdetector) ||
        (item.crateNum === s.crate && item.amcNum === s.amcSlot && item.channelTag === s.channel)
    );
    if (!wfItem?.trace) return { data: [], layout: { title: 'No matching trace', autosize: true } };

    let processedTrace = [...wfItem.trace];
    let pedestal = wfItem.pedestalLevel;

    if (s.subtractPedestal && typeof pedestal === 'number') {
      processedTrace = processedTrace.map(v => v - pedestal);
      pedestal = 0;
    }

    const traceData = {
      type: 'scatter',
      mode: 'lines',
      x: processedTrace.map((_, i) => i),
      y: processedTrace,
      line: { color: s.traceColor },
    };

    const shapes = [];
    const annotations = [];

    if (s.showIntegralBounds && wfItem.integration_window) {
      const { first: start, second: end } = wfItem.integration_window;
      if (s.showIntegralFill) shapes.push({ type: 'rect', x0: start, x1: end, y0: Math.min(...processedTrace), y1: Math.max(...processedTrace), fillcolor: s.integralFillColor, line: { width: 0 } });
      shapes.push({ type: 'line', x0: start, x1: start, y0: Math.min(...processedTrace), y1: Math.max(...processedTrace), line: { color: s.integralLineColor, width: s.integralLineWidth, dash: s.integralLineDash } });
      shapes.push({ type: 'line', x0: end, x1: end, y0: Math.min(...processedTrace), y1: Math.max(...processedTrace), line: { color: s.integralLineColor, width: s.integralLineWidth, dash: s.integralLineDash } });
    }

    if (s.showPedestal && typeof pedestal === 'number') {
      shapes.push({ type: 'line', x0: 0, x1: 1, xref: 'paper', y0: pedestal, y1: pedestal, line: { color: s.pedestalLineColor, width: s.pedestalLineWidth, dash: s.pedestalLineDash } });
    }

    if (s.showPedestalStdev && typeof wfItem.pedestalStdev === 'number') {
      shapes.push({ type: 'rect', x0: 0, x1: 1, xref: 'paper', y0: pedestal - wfItem.pedestalStdev, y1: pedestal + wfItem.pedestalStdev, fillcolor: s.pedestalStdevFillColor, line: { width: 0 } });
    }

    if (s.showIntegralInfoBox) {
      annotations.push({
        x: s.integralInfoBoxX,
        y: s.integralInfoBoxY,
        xref: 'paper',
        yref: 'paper',
        text: `Integral: ${wfItem.integral?.toFixed(2) || 'N/A'}<br>Amplitude: ${wfItem.amplitude?.toFixed(2) || 'N/A'}<br>Peak: ${wfItem.peak_time || 'N/A'}`,
        showarrow: false,
        bgcolor: s.integralInfoBoxBgColor,
        bordercolor: s.integralInfoBoxBorderColor,
        borderwidth: 1,
      });
    }

    const layout = {
      autosize: true,
      margin: { t: 50, r: 20, l: 60, b: 40 },
      xaxis: { title: 'Sample', autorange: !s.fixXAxis, range: s.fixXAxis ? [s.xAxisMin, s.xAxisMax] : undefined },
      yaxis: { title: 'ADC', autorange: !s.fixYAxis, range: s.fixYAxis ? [s.yAxisMin, s.yAxisMax] : undefined },
      shapes,
      annotations,
    };

    return { data: [traceData], layout };
  }

  render() {
    const { loading, error, data, layout, revision } = this.state;

    if (loading) return <div>Loading...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return <Plotly data={data} layout={layout} revision={revision} style={{ width: '100%', height: '100%' }} useResizeHandler config={{ responsive: true }} />;
  }
}
