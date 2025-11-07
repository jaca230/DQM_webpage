// src/App.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import Plotly from 'react-plotly.js';

import Dashboard from './ui/Dashboard';
import initRegistries from './registries/init-registries';
import initFactories from './factories/init-factories';
import PluginLoader from './plugin/PluginLoader';

// Import base classes that plugins need
import Plot from './figures/plots/Plot';
import SettingTypes from './enums/SettingTypes';
import Figure from './figures/Figure';
import BaseFigure from './figures/BaseFigure';
import Table from './figures/tables/Table';

window.React = React; // makes it globally available for plugin eval
window.ReactDOM = ReactDOM; //  makes it globally available for plugin eval
window.Plotly = Plotly; // make Plotly globally available for plugins

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      registryManager: null,
      factoryManager: null,
      pluginLoader: null,
    };
  }

  componentDidMount() {
    const registryManager = initRegistries();
    const factoryManager = initFactories(registryManager);

    // Create the plugin loader with needed managers and base classes
    const pluginLoader = new PluginLoader({
      registryManager,
      factoryManager,
      baseClasses: {
        // Pass the base classes your plugins need access to
        Plot: Plot,
        SettingTypes: SettingTypes,
        Figure: Figure,
        BaseFigure: BaseFigure,
        Table: Table,
      }
    });
    this.setState({ registryManager, factoryManager, pluginLoader });

    const figureRegistry = registryManager.get('figures');
    console.log('Registered local figures:', figureRegistry.getNames());
  }

  render() {
    const { registryManager, factoryManager, pluginLoader } = this.state;

    if (!registryManager || !factoryManager || !pluginLoader) {
      return <div>Loading...</div>;
    }

    return (
      <div style={{ padding: '1rem' }}>
        <h1
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          <span>Data Quality Monitor</span>
          <span
            style={{
              fontSize: '0.9rem',
              letterSpacing: '0.1em',
              color: '#b91c1c',
              border: '1px solid rgba(185,28,28,0.6)',
              borderRadius: '999px',
              padding: '0.15rem 0.65rem',
              fontWeight: 700,
            }}
          >
            DEMO
          </span>
        </h1>
        <Dashboard
          registryManager={registryManager}
          factoryManager={factoryManager}
          pluginLoader={pluginLoader}
        />
      </div>
    );
  }
}

export default App;
