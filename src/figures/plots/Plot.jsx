import React from 'react';
import Plotly from 'react-plotly.js';
import Figure from '../Figure';

export default class Plot extends Figure {
  constructor(props) {
    super(props);
    this.state = {
      data: { x: [], y: [] },
      loading: true,
      error: null,
      revision: 0,
      layout: {
        autosize: true,
        margin: { t: 30, r: 20, l: 40, b: 40 },
        xaxis: { title: 'X' },
        yaxis: { title: 'Y' },
      },
    };
  }

  // 🔹 Runs once on mount
  onInit() {
    this.fetchData();
  }

  // 🔹 Runs every update tick
  onUpdateTick() {
    this.fetchData();
  }

  getDataUrl() {
    throw new Error('getDataUrl() must be implemented in Plot subclass');
  }

  formatData(raw) {
    return {
      x: raw.time || [],
      y: raw.value || [],
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
        const { x, y } = this.formatData(json);
        this.setState((prev) => ({
          data: { x, y },
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
            data={[
              {
                x: data.x,
                y: data.y,
                type: this.getPlotType(),
                mode: 'lines+markers',
                marker: { color: this.getPlotColor() },
              },
            ]}
            layout={{ ...layout }}
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
