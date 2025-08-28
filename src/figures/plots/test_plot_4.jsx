import Figure from '../Figure';
import SettingTypes from '../../enums/SettingTypes';
import Plotly from 'react-plotly.js';
import soccerBallData from './soccer_ball.json';

export default class WFD5SoccerBallWaveformsTest extends Figure {
  static displayName = 'WFD5 Soccer Ball Waveforms Test';
  static name = 'WFD5SoccerBallWaveforms Test';

  static get settingSchema() {
    return {
      ...super.settingSchema,
      dataUrl: {
        type: SettingTypes.STRING,
        default: 'http://127.0.0.1:8000/api/json_path?last=1&json_path=/data_products/WFD5WaveformCollection',
        label: 'Data URL',
        onChange: 'onUpdateTick',
        advanced: true,
      },
      detectorSystems: {
        type: SettingTypes.ARRAY,
        elementType: SettingTypes.STRING,
        default: ['LYSO', 'LYSO', 'LYSO', 'LYSO', 'LYSO', 'LYSO'],
        label: 'Detector Systems',
        advanced: false,
      },
      subdetectors: {
        type: SettingTypes.ARRAY,
        elementType: SettingTypes.STRING,
        default: ['HEX2', 'HEX3', 'HEX4', 'HEX5', 'HEX1', 'PENT'],
        label: 'Subdetectors',
        advanced: false,
      },
      traceColors: {
        type: SettingTypes.ARRAY,
        elementType: SettingTypes.COLOR,
        default: [
          'rgba(70,130,180,1)',
          'rgba(220,20,60,1)',
          'rgba(34,139,34,1)',
          'rgba(255,140,0,1)',
          'rgba(148,0,211,1)',
          'rgba(255,215,0,1)',
        ],
        label: 'Trace Colors',
        onChange: 'onLayoutUpdate',
        advanced: false,
      },
      showSoccerBallOutline: {
        type: SettingTypes.BOOLEAN,
        default: true,
        label: 'Show Soccer Ball Outline',
        onChange: 'onLayoutUpdate',
        advanced: false,
      },
      soccerBallLineColor: {
        type: SettingTypes.COLOR,
        default: 'rgba(51,51,51,0.3)',
        label: 'Soccer Ball Line Color',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      subplotSize: {
        type: SettingTypes.NUMBER,
        default: 0.20,
        label: 'Subplot Size (fraction)',
        onChange: 'onLayoutUpdate',
        advanced: false,
      },
      positionOffsetsX: {
        type: SettingTypes.ARRAY,
        elementType: SettingTypes.NUMBER,
        default: [0, 0, 0, 0, 0, 0],
        label: 'X Position Offsets (fraction)',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      positionOffsetsY: {
        type: SettingTypes.ARRAY,
        elementType: SettingTypes.NUMBER,
        default: [0, 0, 0, 0, 0, 0],
        label: 'Y Position Offsets (fraction)',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      showSubplotLabels: {
        type: SettingTypes.BOOLEAN,
        default: false,
        label: 'Show Subplot Labels',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      subtractPedestal: {
        type: SettingTypes.BOOLEAN,
        default: false,
        label: 'Subtract Pedestal (Global)',
        onChange: 'onLayoutUpdate',
        advanced: false,
      },
      fixYAxis: {
        type: SettingTypes.BOOLEAN,
        default: false,
        label: 'Fix Y Axis Range (Global)',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      yAxisMin: {
        type: SettingTypes.NUMBER,
        default: -2048,
        label: 'Y Axis Min (Global)',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      yAxisMax: {
        type: SettingTypes.NUMBER,
        default: 2048,
        label: 'Y Axis Max (Global)',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      fixXAxis: {
        type: SettingTypes.BOOLEAN,
        default: false,
        label: 'Fix X Axis Range (Global)',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      xAxisMin: {
        type: SettingTypes.NUMBER,
        default: 0,
        label: 'X Axis Min (Global)',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      xAxisMax: {
        type: SettingTypes.NUMBER,
        default: 2048,
        label: 'X Axis Max (Global)',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      showIntegralBounds: {
        type: SettingTypes.BOOLEAN,
        default: true,
        label: 'Show Integral Bounds',
        onChange: 'onLayoutUpdate',
      },
      showIntegralFill: {
        type: SettingTypes.BOOLEAN,
        default: true,
        label: 'Fill Integral Region',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      showIntegralWindowText: {
        type: SettingTypes.BOOLEAN,
        default: false,
        label: 'Show Integral Window Text',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      showPedestal: {
        type: SettingTypes.BOOLEAN,
        default: true,
        label: 'Show Pedestal',
        onChange: 'onLayoutUpdate',
      },
      showPedestalStdev: {
        type: SettingTypes.BOOLEAN,
        default: false,
        label: 'Show Pedestal StdDev',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      showIntegralInfoBox: {
        type: SettingTypes.BOOLEAN,
        default: false,
        label: 'Show Integral Info Box',
        onChange: 'onLayoutUpdate',
      },
      pedestalLineColor: {
        type: SettingTypes.COLOR,
        default: 'black',
        label: 'Pedestal Line Color',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      pedestalLineWidth: {
        type: SettingTypes.NUMBER,
        default: 2,
        label: 'Pedestal Line Width',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      pedestalLineDash: {
        type: SettingTypes.STRING,
        default: 'dash',
        label: 'Pedestal Line Dash',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      pedestalStdevFillColor: {
        type: SettingTypes.COLOR,
        default: 'rgba(0,0,0,0.1)',
        label: 'Pedestal StdDev Fill Color',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      integralLineColor: {
        type: SettingTypes.COLOR,
        default: 'black',
        label: 'Integral Bound Line Color',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      integralLineWidth: {
        type: SettingTypes.NUMBER,
        default: 2,
        label: 'Integral Bound Line Width',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      integralLineDash: {
        type: SettingTypes.STRING,
        default: 'dash',
        label: 'Integral Bound Line Dash',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      integralFillColor: {
        type: SettingTypes.COLOR,
        default: 'rgba(100,150,255,0.15)',
        label: 'Integral Region Fill Color',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      integralInfoBoxBgColor: {
        type: SettingTypes.COLOR,
        default: 'rgba(255,255,255,0.8)',
        label: 'Info Box Background Color',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      integralInfoBoxBorderColor: {
        type: SettingTypes.COLOR,
        default: 'black',
        label: 'Info Box Border Color',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      integralInfoBoxX: {
        type: SettingTypes.NUMBER,
        default: 0.02,
        label: 'Integral Info Box X (domain coords)',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
      integralInfoBoxY: {
        type: SettingTypes.NUMBER,
        default: 0.98,
        label: 'Integral Info Box Y (domain coords)',
        onChange: 'onLayoutUpdate',
        advanced: true,
      },
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
    const { detectorSystems, subdetectors } = this.settings;
    const list = waveformRaw?.data?.arr;

    if (!Array.isArray(list)) {
      return { data: [], layout: { title: 'No waveform data', autosize: true } };
    }

    // Find matching traces for each detector/subdetector pair
    const tracesData = detectorSystems.map((detectorSystem, i) => {
      const subdetector = subdetectors[i];
      const wfItem = list.find(
        (w) => w.detectorSystem === detectorSystem && w.subdetector === subdetector
      );

      return wfItem && wfItem.trace
        ? { wfItem, detectorSystem, subdetector, index: i }
        : null;
    });

    const { data, layout } = this.buildSoccerBallSubplots(tracesData);
    return { data, layout };
  }

  getSoccerBallPositions() {
    const { positionOffsetsX, positionOffsetsY } = this.settings;
    const width = 100;
    const height = 100;
    const scale = 115;
    const rotationDeg = 22.5;

    const centroid = soccerBallData.vertices.reduce(
      (acc, v) => [acc[0] + v[0], acc[1] + v[1]],
      [0, 0]
    ).map(c => c / soccerBallData.vertices.length);

    const rad = (rotationDeg * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const transformVertex = v => {
      const dx = v[0] - centroid[0];
      const dy = v[1] - centroid[1];
      const rx = dx * cosA - dy * sinA;
      const ry = dx * sinA + dy * cosA;
      return { x: rx * scale + width / 2, y: ry * scale + height / 2 };
    };

    const vertices = soccerBallData.vertices.map(transformVertex);
    const positions = [];

    for (let i = 0; i < Math.min(6, soccerBallData.hexagons.length); i++) {
      const hex = soccerBallData.hexagons[i];
      const hexVertices = hex.map(idx => vertices[idx]);
      const center = hexVertices.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }), { x: 0, y: 0 });
      center.x /= hexVertices.length;
      center.y /= hexVertices.length;

      const offsetX = positionOffsetsX[i] || 0;
      const offsetY = positionOffsetsY[i] || 0;

      positions.push({ 
        x: (center.x / width) + offsetX, 
        y: (1 - center.y / height) + offsetY 
      });
    }

    if (positions.length < 6 && soccerBallData.pentagons.length > 0) {
      const pent = soccerBallData.pentagons[0];
      const pentVertices = pent.map(idx => vertices[idx]);
      const center = pentVertices.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }), { x: 0, y: 0 });
      center.x /= pentVertices.length;
      center.y /= pentVertices.length;

      const offsetX = positionOffsetsX[positions.length] || 0;
      const offsetY = positionOffsetsY[positions.length] || 0;

      positions.push({ 
        x: (center.x / width) + offsetX, 
        y: (1 - center.y / height) + offsetY 
      });
    }

    return positions;
  }

  buildSoccerBallSubplots(tracesData) {
    const {
      traceColors, subplotSize, showIntegralBounds, showIntegralFill,
      showPedestal, showPedestalStdev, showIntegralInfoBox, showIntegralWindowText,
      integralLineColor, integralLineWidth, integralLineDash, integralFillColor,
      pedestalLineColor, pedestalLineWidth, pedestalLineDash, pedestalStdevFillColor,
      integralInfoBoxBgColor, integralInfoBoxBorderColor, integralInfoBoxX, integralInfoBoxY,
      showSubplotLabels, subtractPedestal, fixYAxis, yAxisMin, yAxisMax,
      fixXAxis, xAxisMin, xAxisMax
    } = this.settings;

    const positions = this.getSoccerBallPositions();
    const plotlyTraces = [];
    const shapes = [];
    const annotations = [];

    tracesData.forEach((item, i) => {
      if (!item || !item.wfItem || !Array.isArray(item.wfItem.trace) || i >= positions.length) return;

      const { wfItem } = item;
      const trace = wfItem.trace;
      const color = traceColors[i % traceColors.length];

      // Process trace data - subtract pedestal if enabled
      let processedTrace = [...trace];
      let adjustedPedestalLevel = wfItem.pedestalLevel;
      
      if (subtractPedestal && typeof wfItem.pedestalLevel === 'number') {
        processedTrace = trace.map(value => value - wfItem.pedestalLevel);
        adjustedPedestalLevel = 0;
      }

      // Main trace
      plotlyTraces.push({
        type: 'scatter',
        mode: 'lines',
        x: trace.map((_, idx) => idx),
        y: processedTrace,
        line: { color },
        name: `${item.detectorSystem} ${item.subdetector}`,
        xaxis: `x${i + 1}`,
        yaxis: `y${i + 1}`,
        showlegend: false,
        hoverinfo: 'x+y+name',
      });

      // Subplot labels
      if (showSubplotLabels) {
        annotations.push({
          x: 0.5,
          y: 1.05,
          xref: `x${i + 1} domain`,
          yref: `y${i + 1} domain`,
          text: `${item.detectorSystem} ${item.subdetector}`,
          showarrow: false,
          font: { size: 10, color: 'black' },
          align: 'center',
        });
      }

      // Integral bounds + fill
      if (showIntegralBounds && wfItem.integration_window) {
        const { first: startSample, second: endSample } = wfItem.integration_window;
        if (startSample != null && endSample != null) {
          const yMin = Math.min(...processedTrace);
          const yMax = Math.max(...processedTrace);

          if (showIntegralFill) {
            shapes.push({
              type: 'rect',
              xref: `x${i + 1}`,
              yref: `y${i + 1}`,
              x0: startSample,
              x1: endSample,
              y0: yMin,
              y1: yMax,
              fillcolor: integralFillColor,
              line: { width: 0 },
            });
          }
          shapes.push(
            { type: 'line', xref: `x${i + 1}`, yref: `y${i + 1}`, x0: startSample, x1: startSample, y0: yMin, y1: yMax, line: { color: integralLineColor, width: integralLineWidth, dash: integralLineDash }},
            { type: 'line', xref: `x${i + 1}`, yref: `y${i + 1}`, x0: endSample, x1: endSample, y0: yMin, y1: yMax, line: { color: integralLineColor, width: integralLineWidth, dash: integralLineDash }}
          );
          if (showIntegralWindowText) {
            annotations.push({
              x: (startSample + endSample) / 2,
              y: yMax,
              xref: `x${i + 1}`,
              yref: `y${i + 1}`,
              text: `[${startSample}-${endSample}]`,
              showarrow: false,
              font: { size: 8, color: 'black' },
            });
          }
        }
      }

      // Pedestal line + stdev
      if (showPedestal && typeof adjustedPedestalLevel === 'number') {
        shapes.push({
          type: 'line',
          xref: `x${i + 1}`,
          yref: `y${i + 1}`,
          x0: 0,
          x1: trace.length - 1,
          y0: adjustedPedestalLevel,
          y1: adjustedPedestalLevel,
          line: { color: pedestalLineColor, width: pedestalLineWidth, dash: pedestalLineDash },
        });
        if (showPedestalStdev && typeof wfItem.pedestalStdev === 'number') {
          shapes.push({
            type: 'rect',
            xref: `x${i + 1}`,
            yref: `y${i + 1}`,
            x0: 0,
            x1: trace.length - 1,
            y0: adjustedPedestalLevel - wfItem.pedestalStdev,
            y1: adjustedPedestalLevel + wfItem.pedestalStdev,
            fillcolor: pedestalStdevFillColor,
            line: { width: 0 },
          });
        }
      }

      // Info box
      if (showIntegralInfoBox) {
        annotations.push({
          x: integralInfoBoxX,
          y: integralInfoBoxY,
          xref: `x${i + 1} domain`,
          yref: `y${i + 1} domain`,
          text: `Int: ${wfItem.integral?.toFixed(1) || 'N/A'}<br>` +
                `Amp: ${wfItem.amplitude?.toFixed(1) || 'N/A'}`,
          showarrow: false,
          font: { size: 8, color: 'black' },
          align: 'left',
          bgcolor: integralInfoBoxBgColor,
          bordercolor: integralInfoBoxBorderColor,
          borderwidth: 1,
        });
      }
    });

    // Layout + axes
    const layout = {
      autosize: true,
      margin: { t: 20, r: 20, b: 20, l: 20 },
      showlegend: false,
      bargap: 0,
      shapes,
      annotations,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    };

    positions.forEach((pos, i) => {
      if (i < tracesData.length && tracesData[i]) {
        const clampedX = Math.max(subplotSize/2, Math.min(1 - subplotSize/2, pos.x));
        const clampedY = Math.max(subplotSize/2, Math.min(1 - subplotSize/2, pos.y));

        const xDomain = [clampedX - subplotSize/2, clampedX + subplotSize/2];
        const yDomain = [clampedY - subplotSize/2, clampedY + subplotSize/2];

        const xAxisKey = i === 0 ? 'xaxis' : `xaxis${i + 1}`;
        const yAxisKey = i === 0 ? 'yaxis' : `yaxis${i + 1}`;

        const xAxisConfig = {
          domain: xDomain, 
          anchor: `y${i + 1}`, 
          showgrid: true, 
          gridcolor: 'rgba(128,128,128,0.2)', 
          showticklabels: true, 
          zeroline: true, 
          title: ''
        };

        if (fixXAxis) {
          xAxisConfig.range = [xAxisMin, xAxisMax];
          xAxisConfig.autorange = false;
        } else {
          xAxisConfig.autorange = true;
        }

        const yAxisConfig = {
          domain: yDomain, 
          anchor: `x${i + 1}`, 
          showgrid: true, 
          gridcolor: 'rgba(128,128,128,0.2)', 
          showticklabels: true, 
          zeroline: true, 
          title: ''
        };

        if (fixYAxis) {
          yAxisConfig.range = [yAxisMin, yAxisMax];
          yAxisConfig.autorange = false;
        } else {
          yAxisConfig.autorange = true;
        }

        layout[xAxisKey] = xAxisConfig;
        layout[yAxisKey] = yAxisConfig;
      }
    });

    return { data: plotlyTraces, layout };
  }

  renderSoccerBallSVG() {
    const { showSoccerBallOutline, soccerBallLineColor } = this.settings;
    if (!showSoccerBallOutline) return null;

    const width = 100;
    const height = 100;
    const scale = 115;
    const rotationDeg = 22.5;

    const centroid = soccerBallData.vertices.reduce(
      (acc, v) => [acc[0] + v[0], acc[1] + v[1]],
      [0, 0]
    ).map(c => c / soccerBallData.vertices.length);

    const rad = (rotationDeg * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const transformVertex = v => {
      const dx = v[0] - centroid[0];
      const dy = v[1] - centroid[1];
      const rx = dx * cosA - dy * sinA;
      const ry = dx * sinA + dy * cosA;
      return { x: rx * scale + width / 2, y: ry * scale + height / 2 };
    };

    const vertices = soccerBallData.vertices.map(transformVertex);
    const pentagon = soccerBallData.pentagons[0].map(i => vertices[i]);
    const hexagons = soccerBallData.hexagons.map(hex => hex.map(i => vertices[i]));

    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 10 }}
      >
        {hexagons.map((hex, idx) => (
          <polygon
            key={`hex-${idx}`}
            points={hex.map(v => `${v.x},${v.y}`).join(' ')}
            fill="none"
            stroke={soccerBallLineColor}
            strokeWidth="2"
          />
        ))}
        <polygon
          points={pentagon.map(v => `${v.x},${v.y}`).join(' ')}
          fill="none"
          stroke={soccerBallLineColor}
          strokeWidth="2"
        />
      </svg>
    );
  }

  render() {
    const { loading, error, data, layout, revision } = this.state;

    return (
      <div className="no-drag" style={{ width: '100%', height: '100%', position: 'relative' }}>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
        {!loading && !error && (
          <>
            <Plotly
              data={data}
              layout={layout}
              revision={revision}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler
              config={{ responsive: true, displayModeBar: true }}
            />
            {this.renderSoccerBallSVG()}
          </>
        )}
      </div>
    );
  }
}