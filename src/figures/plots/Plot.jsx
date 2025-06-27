import React from 'react';
import Plotly from 'react-plotly.js';
import Figure from '../Figure';

export default class Plot extends Figure {
  static displayName = 'Plot';
  static name = 'Plot';
  constructor(props) {
    super(props);
    this.state = {
      data: [],        // Array of traces (Plotly format)
      layout: {},      // Plotly layout object
      loading: true,
      error: null,
      revision: 0,
    };
  }

  onInit() {
    this.fetchData();
  }

  onUpdateTick() {
    this.fetchData();
  }

  // This method now returns the full plotly traces and layout
  formatPlotly(json) {
    // Default implementation for scatter plot
    return {
      data: [
        {
          x: json.time || [],
          y: json.value || [],
          type: this.getPlotType(),
          mode: 'lines+markers',
          marker: { color: this.getPlotColor() },
        },
      ],
      layout: {
        autosize: true,
        margin: { t: 30, r: 20, l: 40, b: 40 },
        xaxis: { title: 'X' },
        yaxis: { title: 'Y' },
      },
    };
  }

  getPlotType() {
    return 'scatter';
  }

  getPlotColor() {
    return 'gray';
  }

  fetchData = () => {
    fetch(this.getDataUrl())
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const { data, layout } = this.formatPlotly(json);
        this.setState((prev) => ({
          data,
          layout,
          loading: false,
          error: null,
          revision: prev.revision + 1,
        }));
      })
      .catch((err) => {
        this.setState({ error: err.message, loading: false });
      });
  };

  render() {
    const { loading, error, data, layout, revision } = this.state;

    return (
      <div className="no-drag" style={{ width: '100%', height: '100%' }}>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!loading && !error && (
          <Plotly
            data={data}
            layout={layout}
            revision={revision}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
            config={{ responsive: true }}
          />
        )}
      </div>
    );
  }
}
