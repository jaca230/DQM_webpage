import createPlotlyComponent from 'react-plotly.js/factory';
import PlotlyCore from 'plotly.js/lib/core';
import Scatter from 'plotly.js/lib/scatter';
import Bar from 'plotly.js/lib/bar';
import Heatmap from 'plotly.js/lib/heatmap';

// Register the trace types used by the built-in DQM figures without shipping
// the complete Plotly distribution (maps, 3D, finance, WebGL, and so on).
PlotlyCore.register([Scatter, Bar, Heatmap]);

const PlotlyComponent = createPlotlyComponent(PlotlyCore);

export { PlotlyCore };
export default PlotlyComponent;
