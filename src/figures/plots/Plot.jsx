import Plotly from './PlotlyComponent';
import Figure from '../Figure';

export default class Plot extends Figure {
  static displayName = 'Plot';
  static name = 'Plot';

  constructor(props) {
    super(props);
    this.state = {
      ...this.state, // Include loading/error state from Figure
      data: [],
      layout: {},
      revision: 0,
      lastDataAt: null,
      lastDataVersion: null,
      generatedAt: null,
      freshnessNow: Date.now(),
    };
  }

  // Called when backend data arrives (single-source)
  onDataReceived(data) {
    this._updatePlotInternal(data);
  }

  // Called when backend data arrives (multi-source)
  onMultiDataReceived(dataMap) {
    this._updatePlotInternal(dataMap);
  }

  // Called when in "None" mode (NoFetchStrategy)
  onLocalTick() {
    this._updatePlotInternal(null); // no backend data
  }

  _updatePlotInternal(data) {
    try {
      const isInitialLoad = this.state.data.length === 0;

      let plotData, plotLayout;

      if (isInitialLoad) {
        const result = this.initPlot(data);
        plotData = result.data;
        plotLayout = result.layout;
      } else {
        const result = this.updatePlot(data);
        plotData = result.data;
        plotLayout = result.layout || this.state.layout;
      }

      const hasNewData = Array.isArray(plotData) && plotData.length > 0;
      if (!hasNewData && this.state.data.length > 0) {
        this.setState({ error: null, loading: false, freshnessNow: Date.now() });
        return;
      }

      this.setState(prev => ({
        data: plotData,
        layout: plotLayout,
        revision: prev.revision + 1,
        ...(hasNewData ? this.freshnessState(data) : {}),
      }));
    } catch (err) {
      console.error('Error processing plot data:', err);
      this.setState({
        error: `Data processing error: ${err.message}`,
      });
    }
  }

  onDataError(error) {
    super.onDataError(error);
    this.handleUnavailableData();
  }

  onMultiDataError(errorMap) {
    super.onMultiDataError(errorMap);
    // Show first error in the UI
    const firstError = Object.values(errorMap)[0];
    if (this.state.data.length) {
      this.setState({ error: null, loading: false, freshnessNow: Date.now() });
    } else {
      this.setState({ error: firstError, loading: false });
    }
  }

  handleUnavailableData() {
    if (this.state.data.length) {
      this.setState({ error: null, loading: false, freshnessNow: Date.now() });
      return;
    }
    this.setState({ error: null, loading: false }, () => this._updatePlotInternal(null));
  }

  // Default implementations for subclasses to override
  initPlot(json) {
    return this.formatPlotly(json);
  }

  updatePlot(json) {
    return this.formatPlotly(json);
  }

  formatPlotly(json = {}) {
    return {
      data: [
        {
          x: json.time || json.x || [],
          y: json.value || json.y || [],
          type: 'scatter',
          mode: 'lines+markers',
          marker: { color: 'gray' },
        },
      ],
      layout: {
        autosize: true,
        margin: { t: 30, r: 20, l: 40, b: 40 },
        xaxis: { title: json.xlabel || 'X' },
        yaxis: { title: json.ylabel || 'Y' },
      },
    };
  }

  renderPlotCaption() {
    return null;
  }

  render() {
    const { loading, error } = this.state;

    if (loading) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p>Loading plot data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          color: 'red'
        }}>
          <p>Error: {error}</p>
          <button
            onClick={() => this.refreshData()}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    const { data, layout, revision } = this.state;

    return (
      <div className="no-drag plot-container">
        <div className="plot-surface">
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
        </div>
        {this.renderPlotCaption()}
        {this.renderFreshness()}
      </div>
    );
  }
}
