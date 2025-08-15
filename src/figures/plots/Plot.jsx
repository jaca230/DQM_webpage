import Plotly from 'react-plotly.js';
import Figure from '../Figure';

export default class Plot extends Figure {
  static displayName = 'Plot';
  static name = 'Plot';

  constructor(props) {
    super(props);
    this.state = {
      data: [],
      layout: {},
      revision: 0,
      loading: true,
      error: null,
    };
  }

  async onInit() {
    try {
      const json = await this.fetchJson();
      const { data, layout } = this.initPlot(json);
      this.setState({
        data,
        layout,
        loading: false,
        error: null,
        revision: 0,
      });
    } catch (err) {
      this.setState({ error: err.message, loading: false });
    }
  }

  async onUpdateTick() {
    try {
      const json = await this.fetchJson();
      const { data, layout } = this.updatePlot(json);
      this.setState(prev => ({
        data,
        layout: layout || prev.layout, // optional layout updates
        error: null,
        revision: prev.revision + 1,
      }));
    } catch (err) {
      this.setState({ error: err.message });
    }
  }

  // Utility to fetch JSON data from settings-defined URL
  async fetchJson() {
    const res = await fetch(this.getDataUrl());
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  }

  // Default impls for subclasses to override
  initPlot(json) {
    return this.formatPlotly(json);
  }

  updatePlot(json) {
    return this.formatPlotly(json);
  }

  // Shared formatting method for default plot structure
  formatPlotly(json) {
    return {
      data: [
        {
          x: json.time || [],
          y: json.value || [],
          type: 'scatter',
          mode: 'lines+markers',
          marker: { color: 'gray' },
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

  render() {
    const { data, layout, revision, loading, error } = this.state;

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
            useResizeHandler
            config={{ 
              responsive: true,
              modeBarButtonsToRemove: ['select2d', 'lasso2d']
             }}
          />
        )}
      </div>
    );
  }
}
