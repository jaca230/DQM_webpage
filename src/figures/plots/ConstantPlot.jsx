// src/figures/ConstantPlot.jsx
import Plot from './Plot';

export default class ConstantPlot extends Plot {
  getDataUrl() {
    return 'http://localhost:8000/api/constant_data';
  }

  getPlotColor() {
    return 'green';
  }

  formatData(raw) {
    return {
      x: raw.time.map((t) => new Date(t * 1000)),
      y: raw.value,
    };
  }
}
