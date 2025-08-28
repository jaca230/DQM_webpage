import Plotly from 'react-plotly.js';
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
    };
  }

  onDataReceived(data) {
    try {
      // Determine if this is initial load or update
      const isInitialLoad = this.state.data.length === 0;
      
      let plotData, plotLayout;
      
      if (isInitialLoad) {
        // First time receiving data - use initPlot
        const result = this.initPlot(data);
        plotData = result.data;
        plotLayout = result.layout;
      } else {
        // Subsequent updates - use updatePlot
        const result = this.updatePlot(data);
        plotData = result.data;
        // Layout updates are optional in updates
        plotLayout = result.layout || this.state.layout;
      }
      
      this.setState(prev => ({
        data: plotData,
        layout: plotLayout,
        revision: prev.revision + 1,
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
    // Reset plot data on error
    this.setState({
      data: [],
      layout: {},
      revision: 0,
    });
  }

  // Default implementations for subclasses to override
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

  render() {
    const { loading, error } = this.state;
    
    // Show loading/error states from parent Figure class
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
      <div className="no-drag" style={{ width: '100%', height: '100%' }}>
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
    );
  }
}