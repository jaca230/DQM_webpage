import React from 'react';
import Sidebar from './Sidebar';
import FigureGrid from './FigureGrid';
import TabsBar from './TabsBar';
import LoadingScreen from './LoadingScreen';
import TabManager from '../managers/TabManager';
import FigureManager from '../managers/FigureManager';
import StorageManager from '../managers/StorageManager';
import DataFetchManager from '../managers/DataFetchManager';
import PluginManagementService from '../services/PluginManagementService';
import defaultLayout from '../resources/defaultLayout.json';
import defaultPlugins from '../resources/defaultPlugins.json';

/**
 * Main Dashboard component - orchestrates all managers and handles UI events
 */
export default class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    
    // Initialize core dependencies
    this.registryManager = props.registryManager;
    this.factoryManager = props.factoryManager;
    this.pluginLoader = props.pluginLoader;

    // Initialize managers
    this.storageManager = new StorageManager();
    this.tabManager = new TabManager();
    this.figureManager = new FigureManager(this.factoryManager);
    this.pluginService = new PluginManagementService(this.pluginLoader, this.storageManager);
    this.dataFetchManager = new DataFetchManager();

    // Component state
    this.state = {
      // Tab state
      tabs: [],
      activeTabId: null,
      
      // Plugin state
      plugins: [],
      loadingPlugins: true,
      loadingRemainingMs: 0,

      // UI state
      sidebarCollapsed: false,

      //Sync state
      syncMode: true,
    };

    // Bind event handlers
    this.setupEventHandlers();

    // Timer ID for loading countdown
    this.loadingTimerId = null;
  }

  /**
   * Setup event handlers for manager events
   */
  setupEventHandlers() {
    // Tab manager events
    this.tabManager.addListener(this.handleTabManagerChange);
    
    // Figure manager events
    this.figureManager.addListener(this.handleFigureManagerChange);
    
    // Plugin service events
    this.pluginService.addListener(this.handlePluginServiceChange);
    
    // Storage manager events
    this.storageManager.addListener(this.handleStorageEvent);
  }

  /**
   * Handle tab manager state changes
   */
  handleTabManagerChange = ({ tabs, activeTabId }) => {
    this.setState({ tabs, activeTabId });

    if (this.storageManager.autoSave) {
      const layoutData = this.tabManager.toJSON();
      this.storageManager.saveLayout(layoutData);
    }
  };

  /**
   * Handle figure manager changes
   */
  handleFigureManagerChange = ({ figures, layout }) => {
    if (figures && layout) {
      this.tabManager.updateActiveTab({ figures, layout });
    } else if (figures) {
      this.tabManager.updateActiveTab({ figures });
    } else if (layout) {
      this.tabManager.updateActiveTab({ layout });
    }

    if (this.storageManager.autoSave) {
      const layoutData = this.tabManager.toJSON();
      this.storageManager.saveLayout(layoutData);
    }
  };

  // Add this handler method
  handleSyncModeChange = (syncMode) => {
    this.setState({ syncMode });
    const mode = syncMode ? 'sync' : 'async';
    this.dataFetchManager.setMode(mode);
  };

/**
 * Handle plugin service changes including loading remaining time
 */
handlePluginServiceChange = ({ plugins, loading, loadingRemainingMs }) => {
  this.setState({ plugins });

  // Only update loadingRemainingMs timer during initial startup loading
  if (this.state.loadingPlugins) {
    // Always update the remaining time from the service
    this.setState({ loadingRemainingMs: loadingRemainingMs || 0 });

    if (loading) {
      // Start the countdown timer if not already running
      if (!this.loadingTimerId) {
        this.loadingTimerId = setInterval(() => {
          // Get the current remaining time from the service
          const remaining = this.pluginService.getLoadingRemainingMs();
          
          // Update state with current remaining time
          this.setState({ loadingRemainingMs: remaining });
          
          // Check if timeout reached
          if (remaining <= 0) {
            clearInterval(this.loadingTimerId);
            this.loadingTimerId = null;
            // The service should handle the timeout itself
            // We just need to clean up our interval
          }
        }, 100); // Update every 100ms for smoother countdown
      }
    } else {
      // Loading finished - clean up
      this.setState({ 
        loadingRemainingMs: 0,
        loadingPlugins: false // Clear the loading flag
      });
      
      if (this.loadingTimerId) {
        clearInterval(this.loadingTimerId);
        this.loadingTimerId = null;
      }
    }
  }
};

/**
 * Handle loading timeout - this might not be needed since service handles it
 */
handleLoadingTimeout = () => {
  console.warn('Plugin loading timed out');
  this.setState({ 
    loadingPlugins: false,
    loadingRemainingMs: 0 
  });
  
  if (this.loadingTimerId) {
    clearInterval(this.loadingTimerId);
    this.loadingTimerId = null;
  }
  
  // Optionally show a notification
  // alert('Plugin loading timed out. Some plugins may not have loaded correctly.');
};

  /**
   * Handle storage events
   */
  handleStorageEvent = ({ operation, key, data }) => {
    // Could add UI notifications here
    // console.log(`Storage ${operation} for ${key}`);
  };

  /**
   * Initialize dashboard on mount
   */
  async componentDidMount() {
    try {
      const savedLayout = this.storageManager.loadLayout(defaultLayout);
      this.tabManager.loadFromJSON(savedLayout);
      
      // Initialize plugins (this triggers loading screen)
      await this.pluginService.initialize(defaultPlugins);

      // Update state after loading
      this.setState({
        tabs: this.tabManager.getTabs(),
        activeTabId: this.tabManager.getActiveTabId(),
        plugins: this.pluginService.getPlugins(),
      });
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      this.setState({ loadingPlugins: false });
    }
  }

  /**
   * Cleanup on unmount
   */
  componentWillUnmount() {
    // Remove event listeners
    this.tabManager.removeListener(this.handleTabManagerChange);
    this.figureManager.removeListener(this.handleFigureManagerChange);
    this.pluginService.removeListener(this.handlePluginServiceChange);
    this.storageManager.removeListener(this.handleStorageEvent);

    // Clear loading timer if any
    if (this.loadingTimerId) {
      clearInterval(this.loadingTimerId);
      this.loadingTimerId = null;
    }

    this.dataFetchManager.destroy();
  }

  // Tab event handlers
  handleAddTab = () => {
    this.tabManager.addTab();
  };

  handleDeleteTab = (tabId) => {
    if (!this.tabManager.deleteTab(tabId)) {
      alert("Cannot delete the last tab");
    }
  };

  handleRenameTab = (tabId, newName) => {
    this.tabManager.renameTab(tabId, newName);
  };

  handleSelectTab = (tabId) => {
    this.tabManager.selectTab(tabId);
  };

  // Figure event handlers
  handleAddFigure = (figureType) => {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) return;

    const result = this.figureManager.addFigure(
      figureType, 
      activeTab.figures, 
      activeTab.layout
    );
    
    if (result) {
      this.tabManager.updateActiveTab({
        figures: result.figures,
        layout: result.layout
      });
    }
  };

  handleDeleteFigure = (figureId) => {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) return;

    const result = this.figureManager.deleteFigure(
      figureId, 
      activeTab.figures, 
      activeTab.layout
    );
    
    this.tabManager.updateActiveTab({
      figures: result.figures,
      layout: result.layout
    });
  };

  handleTitleChange = (figureId, newTitle) => {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) return;

    const updatedFigures = this.figureManager.updateFigureTitle(
      figureId, 
      newTitle, 
      activeTab.figures
    );
    
    this.tabManager.updateActiveTab({ figures: updatedFigures });
  };

  handleLayoutChange = (newLayout) => {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) return;

    this.figureManager.updateLayout(newLayout, activeTab.figures);
  };

  handleFiguresChange = (updatedFigures) => {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) return;

    this.figureManager.updateFigures(updatedFigures, activeTab.layout);
  };

  handleAddPlugin = async (pluginInfo) => {
    try {
      const result = await this.pluginService.addPlugin(pluginInfo);
      
      if (result.success) {
        // Update the plugins state from the pluginService plugins list or append the new plugin
        this.setState({ plugins: [...this.pluginService.plugins] });
      }

      return result;
    } catch (error) {
      alert(`Failed to add plugin: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  handleRemovePlugin = (pluginId) => {
    this.pluginService.removePlugin(pluginId);
  };

  handleLoadPlugin = async (pluginId) => {
    try {
      const result = await this.pluginService.loadPlugin(pluginId);

      if (!result.success) {
        alert(`Failed to load plugin: ${result.pluginInfo?.name || pluginId}\n\n${result.error}`);
      } else {
        //console.log(`Plugin loaded via ${result.method}:`, result.pluginInfo.name);
        //console.log(`Figures registered:`, result.newNames);
      }
    } catch (error) {
      alert(`Unexpected error while loading plugin: ${error.message}`);
    }
  };

  // Import/Export handlers
  handleExportLayout = () => {
    const layoutData = this.tabManager.toJSON();
    this.storageManager.exportLayout(layoutData);
  };

  handleExportPlugins = () => {
    const pluginsData = this.pluginService.exportPlugins();
    this.storageManager.exportPlugins(pluginsData);
  };

  handleImportLayout = async (jsonString) => {
    try {
      const parsed = this.storageManager.importFromJSON(jsonString);
      if (parsed) {
        this.tabManager.loadFromJSON(parsed);
      }
    } catch (error) {
      alert('Failed to import layout: Invalid JSON');
    }
  };

  handleImportPlugins = async (jsonString) => {
    try {
      const parsed = this.storageManager.importFromJSON(jsonString);
      if (parsed && Array.isArray(parsed)) {
        await this.pluginService.importPlugins(parsed);
      } else if (parsed && Array.isArray(parsed.plugins)) {
        await this.pluginService.importPlugins(parsed.plugins);
      } else {
        throw new Error('Invalid plugins format');
      }
    } catch (error) {
      alert(`Failed to import plugins: ${error.message}`);
    }
  };

  // Export current tab
  handleExportTab = () => {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) {
      alert('No active tab to export');
      return;
    }

    this.storageManager.exportTab(activeTab);
  };

  // Import tab
  handleImportTab = async (jsonString) => {
    try {
      const importedTab = this.storageManager.importTab(jsonString);
      
      if (!importedTab) {
        throw new Error('Failed to parse tab data');
      }

      // Add the imported tab to the tab manager
      this.tabManager.addTab(importedTab);
      
    } catch (error) {
      alert(`Failed to import tab: ${error.message}`);
    }
  };

  // Reset/Clear handlers
  handleClearLayout = () => {
    if (window.confirm('Are you sure you want to clear all tabs?')) {
      this.tabManager.clearTabs();
    }
  };

  handleClearPlugins = () => {
    if (window.confirm(
      'Are you sure you want to clear all plugins? Figures from these plugins will remain available until you refresh the page.'
    )) {
      this.pluginService.clearPlugins();
    }
  };

  handleResetLayout = () => {
    if (window.confirm('Are you sure you want to reset to the default layout?')) {
      this.tabManager.loadFromJSON(defaultLayout);
    }
  };

  handleResetPlugins = async () => {
    if (window.confirm('Are you sure you want to reset plugins to default?')) {
      try {
        await this.pluginService.resetToDefault(defaultPlugins);
      } catch (error) {
        console.error('Error resetting plugins:', error);
      }
    }
  };

  // Reload plugins
  reloadPlugins = async () => {
    try {
      await this.pluginService.reloadStartupPlugins();
    } catch (error) {
      console.error('Error reloading plugins:', error);
    }
  };

  // UI handlers
  handleSidebarCollapse = (collapsed) => {
    this.setState({ sidebarCollapsed: collapsed });
  };

  // Update the render method to pass additional props to Sidebar:
  render() {
    const { loadingPlugins, loadingRemainingMs, tabs, activeTabId, sidebarCollapsed, plugins, syncMode } = this.state;

    // Only show full-page loading screen on initial load
    if (loadingPlugins) {
      return (
        <LoadingScreen 
          remainingMs={loadingRemainingMs} 
          message="Loading plugins, please wait..."
          onTimeout={this.handleLoadingTimeout}
        />
      );
    }

    // Normal dashboard UI below
    const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
    const figureFactory = this.factoryManager.get('figures');
    const figureTypes = this.registryManager.get('figures').getAll();

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
            figureTypes={figureTypes}
            onAddFigure={this.handleAddFigure}
            onExportLayout={this.handleExportLayout}
            onExportPlugins={this.handleExportPlugins}
            onImportLayout={this.handleImportLayout}
            onImportPlugins={this.handleImportPlugins}
            onClearLayout={this.handleClearLayout}
            onResetLayout={this.handleResetLayout}
            onClearPlugins={this.handleClearPlugins}
            onResetPlugins={this.handleResetPlugins}
            onAddPlugin={this.handleAddPlugin}
            onRemovePlugin={this.handleRemovePlugin}
            onLoadPlugin={this.handleLoadPlugin}
            onExportTab={this.handleExportTab}
            onImportTab={this.handleImportTab}
            plugins={plugins}
            tabs={tabs}
            activeTabId={activeTabId}
            onCollapse={this.handleSidebarCollapse}
            syncMode={syncMode}
            onSyncModeChange={this.handleSyncModeChange}
            dataManager={this.dataFetchManager}
          />
          <FigureGrid
            figures={activeTab?.figures || []}
            layout={activeTab?.layout || []}
            onLayoutChange={this.handleLayoutChange}
            onDeleteFigure={this.handleDeleteFigure}
            onTitleChange={this.handleTitleChange}
            onFiguresChange={this.handleFiguresChange}
            figureFactory={figureFactory}
            sidebarCollapsed={sidebarCollapsed}
            dataManager={this.dataFetchManager}
          />
        </div>
      </div>
    );
  }
}