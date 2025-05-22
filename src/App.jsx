// src/App.jsx
import React from 'react';
import Dashboard from './ui/Dashboard';
import initRegistries from './registries/init-registries';
import initFactories from './factories/init-factories';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      registryManager: null,
      factoryManager: null,
    };
  }

  componentDidMount() {
    const registryManager = initRegistries();
    const factoryManager = initFactories(registryManager);

    this.setState({ registryManager, factoryManager });

    const figureRegistry = registryManager.get('figures');
    console.log('Registered figures:', figureRegistry.getNames());
  }

  render() {
    const { registryManager, factoryManager } = this.state;

    // Wait until both managers are initialized
    if (!registryManager || !factoryManager) {
      return <div>Loading...</div>;
    }

    return (
      <div style={{ padding: '1rem' }}>
        <h1>Data Quality Monitor</h1>
        <Dashboard
          registryManager={registryManager}
          factoryManager={factoryManager}
        />
      </div>
    );
  }
}

export default App;
