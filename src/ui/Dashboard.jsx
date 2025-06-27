import React from 'react';
import Sidebar from './Sidebar';
import FigureGrid from './FigureGrid';
import TabsBar from './TabsBar';
import defaultLayout from '../resources/defaultLayout.json';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.registryManager = props.registryManager;
    this.factoryManager = props.factoryManager;
    this.pluginLoader = props.pluginLoader;

    this.state = {
      pluginUrls: [],
      activeTabId: null,
      tabs: [],
      sidebarCollapsed: false,
      loadingPlugins: true,
    };
  }

  async componentDidMount() {
    let savedLayout = null;
    try {
      const saved = localStorage.getItem('dashboard-layout');
      if (saved) {
        const parsed = JSON.parse(saved);
        savedLayout = parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved layout from localStorage:', e);
    }

    const layoutToLoad = savedLayout || defaultLayout;
    const pluginUrls = layoutToLoad.pluginUrls || [];

    try {
      await this.pluginLoader.loadPluginsFromUrls(pluginUrls);
      console.info('All plugins loaded');
    } catch (err) {
      console.warn('Error loading some plugins:', err);
    }

    this.setState({
      tabs: layoutToLoad.tabs || [],
      activeTabId: layoutToLoad.activeTabId || (layoutToLoad.tabs && layoutToLoad.tabs[0]?.id),
      pluginUrls,
      sidebarCollapsed: false,
      loadingPlugins: false,
    });
  }

  findNextFreePosition(layout, w, h, step = 20) {
    let y = 0;
    while (y < 10000) {
      const currentY = y;
      for (let x = 0; x < 3000; x += step) {
        const collides = layout.some(item => {
          const xOverlap = x < item.x + item.width && x + w > item.x;
          const yOverlap = currentY < item.y + item.height && currentY + h > item.y;
          return xOverlap && yOverlap;
        });
        if (!collides) {
          return { x, y: currentY };
        }
      }
      y += step;
    }
    return { x: 0, y: 0 };
  }

  handleAddTab = () => {
    const newTabId = `tab${Date.now()}`;
    this.setState(prev => ({
      tabs: [...prev.tabs, {
        id: newTabId,
        name: `New Tab ${prev.tabs.length + 1}`,
        figures: [],
        layout: []
      }],
      activeTabId: newTabId
    }));
  };

  handleDeleteTab = (tabId) => {
    if (this.state.tabs.length <= 1) {
      alert("Cannot delete the last tab");
      return;
    }

    this.setState(prev => {
      const newTabs = prev.tabs.filter(tab => tab.id !== tabId);
      const newActiveTabId = prev.activeTabId === tabId ?
        newTabs[0].id : prev.activeTabId;

      return {
        tabs: newTabs,
        activeTabId: newActiveTabId
      };
    });
  };

  handleRenameTab = (tabId, newName) => {
    this.setState(prev => ({
      tabs: prev.tabs.map(tab =>
        tab.id === tabId ? { ...tab, name: newName } : tab
      )
    }));
  };

  handleSelectTab = (tabId) => {
    this.setState({ activeTabId: tabId });
  };

  handleSidebarCollapse = (collapsed) => {
    this.setState({ sidebarCollapsed: collapsed });
  };

  handleAddFigure = (figureType) => {
    const figureFactory = this.factoryManager.get('figures');
    if (!figureFactory) {
      console.warn("Figure factory not found");
      return;
    }

    const tempFigure = figureFactory.create({ type: figureType });
    if (!tempFigure) {
      console.warn(`Could not create figure of type '${figureType}'`);
      return;
    }

    const newFigure = tempFigure.toJSON();
    newFigure.title = `${figureType} (${newFigure.id})`;

    const width = 400;
    const height = 300;

    this.setState(prev => {
      const activeTab = prev.tabs.find(tab => tab.id === prev.activeTabId);
      const pos = this.findNextFreePosition(activeTab.layout, width, height);
      const layoutItem = {
        id: newFigure.id,
        x: pos.x,
        y: pos.y,
        width,
        height,
      };

      return {
        tabs: prev.tabs.map(tab =>
          tab.id === prev.activeTabId ? {
            ...tab,
            figures: [...tab.figures, newFigure],
            layout: [...tab.layout, layoutItem]
          } : tab
        )
      };
    });
  };

  handleTitleChange = (id, newTitle) => {
    this.setState(prev => ({
      tabs: prev.tabs.map(tab =>
        tab.id === prev.activeTabId ? {
          ...tab,
          figures: tab.figures.map(f =>
            f.id === id ? { ...f, title: newTitle } : f
          )
        } : tab
      )
    }));
  };

  handleDeleteFigure = (id) => {
    this.setState(prev => ({
      tabs: prev.tabs.map(tab =>
        tab.id === prev.activeTabId ? {
          ...tab,
          figures: tab.figures.filter(f => f.id !== id),
          layout: tab.layout.filter(l => l.id !== id)
        } : tab
      )
    }));
  };

  handleLayoutChange = (newLayout) => {
    this.setState(prev => ({
      tabs: prev.tabs.map(tab =>
        tab.id === prev.activeTabId ? {
          ...tab,
          layout: newLayout
        } : tab
      )
    }));
  };

  handleFiguresChange = (updatedFigures) => {
    this.setState(prev => ({
      tabs: prev.tabs.map(tab =>
        tab.id === prev.activeTabId ? {
          ...tab,
          figures: updatedFigures
        } : tab
      )
    }));
  };

  handleClearLayout = () => {
    if (window.confirm('Are you sure you want to clear all tabs?')) {
      this.setState(prevState => ({
        activeTabId: 'tab1',
        tabs: [{
          id: 'tab1',
          name: 'Default Tab',
          figures: [],
          layout: []
        }],
        // Keep the plugins URLs intact
        pluginUrls: prevState.pluginUrls,
      }));
      // Save updated layout (with cleared tabs but plugins kept)
      this.saveLayoutToStorage();
    }
  };

  handleClearPlugins = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all plugins? Figures from these plugins will remain available until you refresh the page.'
      )
    ) {
      this.setState(
        {
          pluginUrls: [],
        },
        () => {
          this.saveLayoutToStorage();
        }
      );
    }
  };

  handleResetLayout = async () => {
    if (!window.confirm('Are you sure you want to reset to the default layout?')) return;

    this.setState({ loadingPlugins: true });

    try {
      await this.pluginLoader.loadPluginsFromUrls(defaultLayout.pluginUrls || []);
      this.setState({
        activeTabId: defaultLayout.activeTabId,
        tabs: JSON.parse(JSON.stringify(defaultLayout.tabs)),
        pluginUrls: defaultLayout.pluginUrls || [],
        sidebarCollapsed: false,
        loadingPlugins: false,
      });
    } catch (e) {
      alert('Failed to load plugins for default layout');
      this.setState({ loadingPlugins: false });
    }
  };

  handleExport = () => {
    const dataStr = JSON.stringify(this.toJSON(), null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-layout.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  handleExportActiveTab = () => {
    const activeTab = this.state.tabs.find(tab => tab.id === this.state.activeTabId);
    const dataStr = JSON.stringify(activeTab, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tab-${activeTab.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  handleImport = async (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      await this.fromJSON(parsed);
      localStorage.setItem('dashboard-layout', JSON.stringify(this.toJSON()));
    } catch (e) {
      alert('Failed to parse JSON');
    }
  };

  handleImportTab = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.figures || !parsed.layout) {
        throw new Error('Invalid tab format');
      }

      const newTabId = `tab${Date.now()}`;
      this.setState(prev => ({
        tabs: [...prev.tabs, {
          id: newTabId,
          name: parsed.name || `Imported Tab ${prev.tabs.length + 1}`,
          figures: parsed.figures,
          layout: parsed.layout
        }],
        activeTabId: newTabId
      }));
    } catch (e) {
      alert('Failed to parse tab JSON');
    }
  };

  // Save full layout (including pluginUrls) to localStorage
  saveLayoutToStorage = () => {
    try {
      localStorage.setItem('dashboard-layout', JSON.stringify(this.toJSON()));
    } catch (e) {
      console.warn('Failed to save layout to localStorage:', e);
    }
  };

  // Override toJSON to include pluginUrls
  toJSON = () => ({
    tabs: this.state.tabs,
    activeTabId: this.state.activeTabId,
    pluginUrls: this.state.pluginUrls,
  });

  // Override fromJSON to load plugins before setting layout state
  fromJSON = async (json) => {
    if (!json || !json.tabs || !Array.isArray(json.tabs)) {
      alert('Invalid layout JSON');
      return;
    }

    const pluginUrls = json.pluginUrls || [];

    this.setState({ loadingPlugins: true });

    // Helper function to add timeout to a promise
    const timeoutPromise = (promise, ms) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Plugin loading timed out'));
        }, ms);

        promise
          .then((res) => {
            clearTimeout(timer);
            resolve(res);
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });

    try {
      // Wait for plugin loading or timeout after 10 seconds (10000 ms)
      await timeoutPromise(this.pluginLoader.loadPluginsFromUrls(pluginUrls), 10000);
    } catch (e) {
      alert('Failed to load some plugins or timeout reached');
      console.warn(e);
    }

    this.setState({
      tabs: json.tabs,
      activeTabId: json.activeTabId || json.tabs[0].id,
      pluginUrls,
      loadingPlugins: false,
    });
  };

  // Add new plugin URL dynamically and load it
handleAddPluginUrl = async (url) => {
  if (!url) return;

  if (this.state.pluginUrls.includes(url)) {
    alert('Plugin URL already added');
    return;
  }

  this.setState({ loadingPlugins: true });
  try {
    // Get registry and figure names before loading plugin
    const figureRegistry = this.registryManager.get('figures');
    const beforeNames = figureRegistry.getNames();

    // Load the plugin from URL (which registers figures)
    await this.pluginLoader.loadPluginFromUrl(url);

    // Get figure names after plugin load
    const afterNames = figureRegistry.getNames();

    // Determine newly registered figure names
    const newNames = afterNames.filter(name => !beforeNames.includes(name));

    // Show notification or alert with newly added figures
    if (newNames.length) {
      alert(
        `Plugin loaded successfully from:\n${url}\n\nNew figures registered:\n- ${newNames.join('\n- ')}`
      );
    } else {
      alert(`Plugin loaded from ${url}, but no new figures were registered.`);
    }

    // Update state and localStorage with new plugin URL
    this.setState(prev => {
      const newPluginUrls = [...prev.pluginUrls, url];
      localStorage.setItem(
        'dashboard-layout',
        JSON.stringify({
          ...this.toJSON(),
          pluginUrls: newPluginUrls,
        })
      );

      return {
        pluginUrls: newPluginUrls,
        loadingPlugins: false,
      };
    });
  } catch (e) {
    alert(`Failed to load plugin from ${url}`);
    this.setState({ loadingPlugins: false });
  }
};

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.tabs !== this.state.tabs ||
      prevState.activeTabId !== this.state.activeTabId ||
      prevState.pluginUrls !== this.state.pluginUrls
    ) {
      this.saveLayoutToStorage();
    }
  }

  render() {
    if (this.state.loadingPlugins) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f5f7fa',
          color: '#333',
          fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
          fontSize: 18,
          userSelect: 'none',
        }}>
          <div style={{
            border: '6px solid #e0e0e0',
            borderTop: '6px solid #007bff',
            borderRadius: '50%',
            width: 48,
            height: 48,
            animation: 'spin 1s linear infinite',
            marginBottom: 16,
          }} />
          <div>Loading plugins, please wait...</div>

          {/* CSS animation keyframes */}
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      );
    }

    const { activeTabId, tabs, sidebarCollapsed } = this.state;
    const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
    const figureFactory = this.factoryManager.get('figures');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <TabsBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={this.handleSelectTab}
          onAddTab={this.handleAddTab}
          onDeleteTab={this.handleDeleteTab}
          onRenameTab={this.handleRenameTab}
        />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar
            figureTypes={this.registryManager.get('figures').getAll()}
            onAddFigure={this.handleAddFigure}
            onExport={this.handleExport}
            onExportActiveTab={this.handleExportActiveTab}
            onImport={this.handleImport}
            onImportTab={this.handleImportTab}
            onClearLayout={this.handleClearLayout}
            onResetLayout={this.handleResetLayout}
            onCollapse={this.handleSidebarCollapse}
            onAddPluginUrl={this.handleAddPluginUrl}
            onClearPlugins={this.handleClearPlugins}
          />
          <FigureGrid
            figures={activeTab.figures}
            layout={activeTab.layout}
            onLayoutChange={this.handleLayoutChange}
            onDeleteFigure={this.handleDeleteFigure}
            onTitleChange={this.handleTitleChange}
            onFiguresChange={this.handleFiguresChange}
            figureFactory={figureFactory}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>
      </div>
    );
  }
}

export default Dashboard;
