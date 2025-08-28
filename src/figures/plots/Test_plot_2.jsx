import soccerBallData from './soccer_ball.json';
import Figure from '../Figure';
import SettingTypes from '../../enums/SettingTypes';
import Plotly from 'react-plotly.js';

export default class WFD5LysoArrayHistogramsTest extends Figure {
  static displayName = 'WFD5 Lyso Array Histograms test';
  static name = 'WFD5LysoArrayHistograms test';

  static get settingSchema() {
    return {
      updateFrequency: {
        type: SettingTypes.NUMBER,
        default: 2,
        label: 'Update Interval (s)',
        onChange: 'onLayoutUpdate',
      },
      dataUrl: {
        type: SettingTypes.STRING,
        default: 'http://127.0.0.1:8000/api/json_path?last=1&json_path=/data_products/WFD5TraceIntegralHistogramCollection',
        label: 'Data URL',
        advanced: true,
      },
      detectorSystems: {
        type: SettingTypes.ARRAY,
        elementType: SettingTypes.STRING,
        default: ['LYSO', 'LYSO', 'LYSO', 'LYSO', 'LYSO', 'LYSO'],
        label: 'Detector Systems',
      },
      subdetectors: {
        type: SettingTypes.ARRAY,
        elementType: SettingTypes.STRING,
        default: ['HEX2', 'HEX3', 'HEX4', 'HEX5', 'HEX1', 'PENT'],
        label: 'Subdetectors',
      },
      barColors: {
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
        label: 'Bar Colors',
      },
      showSoccerBallOutline: {
        type: SettingTypes.BOOLEAN,
        default: true,
        label: 'Show Soccer Ball Outline',
      },
      soccerBallLineColor: {
        type: SettingTypes.COLOR,
        default: 'rgba(51,51,51,0.3)',
        label: 'Soccer Ball Line Color',
        advanced: true,
      },
      subplotSize: {
        type: SettingTypes.NUMBER,
        default: 0.20,
        label: 'Subplot Size (fraction)',
      },
      positionOffsetsX: {
        type: SettingTypes.ARRAY,
        elementType: SettingTypes.NUMBER,
        default: [0, 0, 0, 0, 0, 0],
        label: 'X Position Offsets',
        advanced: true,
      },
      positionOffsetsY: {
        type: SettingTypes.ARRAY,
        elementType: SettingTypes.NUMBER,
        default: [0, 0, 0, 0, 0, 0],
        label: 'Y Position Offsets',
        advanced: true,
      },
      barBorderColor: {
        type: SettingTypes.COLOR,
        default: 'rgba(0,0,0,1)',
        label: 'Bar Border Color',
        advanced: true,
      },
      barBorderWidth: {
        type: SettingTypes.NUMBER,
        default: 0,
        label: 'Bar Border Width',
        advanced: true,
      },
      showSubplotLabels: {
        type: SettingTypes.BOOLEAN,
        default: false,
        label: 'Show Subplot Labels',
        advanced: true,
      },
      useLogScale: {
        type: SettingTypes.BOOLEAN,
        default: false,
        label: 'Use Log Scale (Y-axis)',
      },
    };
  }

  constructor(props) {
    super(props);
    this.latestHistogramRaw = null;
    this.state.plotlyData = [];
    this.state.plotlyLayout = {};
    this.state.revision = 0;
  }

  onDataReceived(histogramRaw) {
    this.latestHistogramRaw = histogramRaw;
    const { data, layout } = this.processHistogramData(histogramRaw);
    this.setState({ plotlyData: data, plotlyLayout: layout, revision: this.state.revision + 1 });
  }

  onLayoutUpdate() {
    if (!this.latestHistogramRaw) return;
    const { data, layout } = this.processHistogramData(this.latestHistogramRaw);
    this.setState({ plotlyData: data, plotlyLayout: layout, revision: this.state.revision + 1 });
  }

  processHistogramData(histogramRaw) {
    const { detectorSystems, subdetectors } = this.settings;

    const histogramsData = detectorSystems.map((detectorSystem, i) => {
      const subdetector = subdetectors[i];
      const histList = histogramRaw?.data?.arr;
      if (!Array.isArray(histList)) return null;

      const escapedDetector = detectorSystem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedSubdetector = subdetector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const detectorPattern = `det[_\\s]*${escapedDetector}(?:[_\\s]|$)`;
      const subdetectorPattern = `subdet[_\\s]*${escapedSubdetector}(?:[_\\s]|$)`;

      const combinedPattern = new RegExp(`(?=.*${detectorPattern})(?=.*${subdetectorPattern})`, 'i');

      const histItem = histList.find((h) => {
        const name = h.fName ?? '';
        const title = h.fTitle ?? '';
        return combinedPattern.test(`${name} ${title}`);
      });

      return histItem ? { histItem, detectorSystem, subdetector, index: i } : null;
    });

    const { data, layout } = this.buildSoccerBallSubplots(histogramsData);
    return { data, layout };
  }

  extractHistogramData(histItem, barColor) {
    const { barBorderColor, barBorderWidth } = this.settings;
    if (!histItem || !Array.isArray(histItem.fArray)) return null;

    const fXaxis = histItem.fXaxis || {};
    const nBins = fXaxis.fNbins || histItem.fArray.length - 2;
    const xMin = fXaxis.fXmin ?? 0;
    const xMax = fXaxis.fXmax ?? 1;
    const binWidth = (xMax - xMin) / nBins;

    const binEdges = Array.from({ length: nBins + 1 }, (_, i) => xMin + i * binWidth);
    const counts = histItem.fArray.slice(1, nBins + 1);
    const yVals = [0, ...counts];

    return {
      type: 'bar',
      x: binEdges,
      y: yVals,
      name: histItem.fName || 'Histogram',
      marker: {
        color: barColor,
        line: { color: barBorderColor, width: barBorderWidth },
      },
      hoverinfo: 'x+y+name',
      width: binWidth,
    };
  }

  buildSoccerBallSubplots(histogramsData) {
    const { barColors, subplotSize, showSubplotLabels, useLogScale, positionOffsetsX, positionOffsetsY } = this.settings;
    const positions = this.getSoccerBallPositions();
    const plotlyTraces = [];
    const annotations = [];

    histogramsData.forEach((item, i) => {
      if (!item || !item.histItem || i >= positions.length) return;
      const histData = this.extractHistogramData(item.histItem, barColors[i % barColors.length]);
      if (!histData) return;

      plotlyTraces.push({
        ...histData,
        name: `${item.detectorSystem} ${item.subdetector}`,
        xaxis: `x${i + 1}`,
        yaxis: `y${i + 1}`,
        showlegend: false,
      });

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
    });

    const layout = {
      autosize: true,
      margin: { t: 20, r: 20, b: 20, l: 20 },
      showlegend: false,
      bargap: 0,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      annotations,
    };

    positions.forEach((pos, i) => {
      if (i < histogramsData.length && histogramsData[i]) {
        const clampedX = Math.max(subplotSize/2, Math.min(1 - subplotSize/2, pos.x));
        const clampedY = Math.max(subplotSize/2, Math.min(1 - subplotSize/2, pos.y));

        const xDomain = [clampedX - subplotSize/2, clampedX + subplotSize/2];
        const yDomain = [clampedY - subplotSize/2, clampedY + subplotSize/2];

        const xAxisKey = i === 0 ? 'xaxis' : `xaxis${i + 1}`;
        const yAxisKey = i === 0 ? 'yaxis' : `yaxis${i + 1}`;

        layout[xAxisKey] = {
          domain: xDomain,
          anchor: `y${i + 1}`,
          showgrid: true,
          gridcolor: 'rgba(128,128,128,0.2)',
          showticklabels: true,
          zeroline: false,
          title: '',
        };
        layout[yAxisKey] = {
          domain: yDomain,
          anchor: `x${i + 1}`,
          showgrid: true,
          gridcolor: 'rgba(128,128,128,0.2)',
          showticklabels: true,
          zeroline: false,
          title: '',
          type: useLogScale ? 'log' : 'linear',
        };
      }
    });

    return { data: plotlyTraces, layout };
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
      const center = hexVertices.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }), { x:0, y:0 });
      center.x /= hexVertices.length;
      center.y /= hexVertices.length;
      positions.push({ x: (center.x/width)+positionOffsetsX[i]||0, y: (1-(center.y/height))+positionOffsetsY[i]||0 });
    }

    if (positions.length < 6 && soccerBallData.pentagons.length > 0) {
      const pent = soccerBallData.pentagons[0];
      const pentVertices = pent.map(idx => vertices[idx]);
      const center = pentVertices.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }), { x:0, y:0 });
      center.x /= pentVertices.length;
      center.y /= pentVertices.length;
      positions.push({ x: (center.x/width)+positionOffsetsX[positions.length]||0, y: (1-(center.y/height))+positionOffsetsY[positions.length]||0 });
    }

    return positions;
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
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ position:'absolute', top:0, left:0, pointerEvents:'none', zIndex:10 }}>
        {hexagons.map((hex, idx) => (
          <polygon key={`hex-${idx}`} points={hex.map(v=>`${v.x},${v.y}`).join(' ')} fill="none" stroke={soccerBallLineColor} strokeWidth="2" />
        ))}
        <polygon points={pentagon.map(v=>`${v.x},${v.y}`).join(' ')} fill="none" stroke={soccerBallLineColor} strokeWidth="2" />
      </svg>
    );
  }

  render() {
    const { plotlyData, plotlyLayout, revision } = this.state;

    return (
      <div className="no-drag" style={{ width:'100%', height:'100%', position:'relative' }}>
        <Plotly data={plotlyData} layout={plotlyLayout} revision={revision} style={{ width:'100%', height:'100%' }} useResizeHandler config={{ responsive:true, displayModeBar:true }} />
        {this.renderSoccerBallSVG()}
      </div>
    );
  }
}
