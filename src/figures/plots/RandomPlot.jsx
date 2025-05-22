// src/figures/RandomPlot.jsx
import Plot from './Plot';

export default class RandomPlot extends Plot {
  getDataUrl() {
    return 'http://localhost:8000/api/random_data';
  }

  getPlotColor() {
    return 'blue';
  }

  formatData(raw) {
    return {
      x: raw.time.map((t) => new Date(t * 1000)),
      y: raw.value,
    };
  }
}
