import createPlotlyComponent from 'react-plotly.js/factory';
import PlotlyCore from 'plotly.js/lib/core';
import Scatter from 'plotly.js/lib/scatter';

// The built-in DQM waveform, hit, and histogram views are all represented as
// scatter traces. Register only what the dashboard uses instead of shipping
// the complete Plotly distribution (maps, 3D, finance, WebGL, and so on).
PlotlyCore.register([Scatter]);

const PlotlyComponent = createPlotlyComponent(PlotlyCore);

export { PlotlyCore };
export default PlotlyComponent;
