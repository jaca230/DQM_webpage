// src/App.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import Dashboard from './ui/Dashboard';
import initRegistries from './registries/init-registries';
import initFactories from './factories/init-factories';
import PluginLoader from './plugin/PluginLoader';

// Import base classes that plugins need
import Plot from './figures/plots/Plot';
import SettingTypes from './enums/SettingTypes';
import Figure from './figures/Figure';
import StaticFigure from './figures/StaticFigure';
import Table from './figures/tables/Table';

window.React = React; // makes it globally available for plugin eval
window.ReactDOM = ReactDOM; //  makes it globally available for plugin eval

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
        StaticFigure: StaticFigure,
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
        <h1>Data Quality Monitor</h1>
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