import React from 'react';
import Sidebar from './Sidebar';
import FigureGrid from './FigureGrid';
import TabsBar from './TabsBar';
import TabManager from '../managers/TabManager';
import FigureManager from '../managers/FigureManager';
import StorageManager from '../managers/StorageManager';
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

    // Component state
    this.state = {
      // Tab state
      tabs: [],
      activeTabId: null,
      
      // Plugin state
      plugins: [],
      loadingPlugins: true,
      
      // UI state
      sidebarCollapsed: false,
    };

    // Bind event handlers
    this.setupEventHandlers();
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

  /**
   * Handle plugin service changes
   */
  handlePluginServiceChange = ({ plugins, loading }) => {
    this.setState({ 
      plugins, 
      loadingPlugins: loading 
    });
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
      // Load layout from storage
      const savedLayout = this.storageManager.loadLayout(defaultLayout);
      this.tabManager.loadFromJSON(savedLayout);
      
      // Initialize plugins
      await this.pluginService.initialize(defaultPlugins);
      
      // Update state with loaded data
      this.setState({
        tabs: this.tabManager.getTabs(),
        activeTabId: this.tabManager.getActiveTabId(),
        plugins: this.pluginService.getPlugins(),
        loadingPlugins: false,
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

  // Plugin event handlers
  handleAddPlugin = async (pluginInfo) => {
    try {
      await this.pluginService.addPlugin(pluginInfo);
    } catch (error) {
      alert(`Failed to add plugin: ${error.message}`);
    }
  };

  handleRemovePlugin = (pluginId) => {
    this.pluginService.removePlugin(pluginId);
  };

  handleLoadPlugin = async (pluginId) => {
    try {
      await this.pluginService.loadPlugin(pluginId);
    } catch (error) {
      alert(`Failed to load plugin: ${error.message}`);
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

  /**
   * Render loading screen
   */
  renderLoadingScreen() {
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

  // Update the render method to pass additional props to Sidebar:
  render() {
    const { loadingPlugins, tabs, activeTabId, sidebarCollapsed, plugins } = this.state;

    // Show loading screen while initializing
    if (loadingPlugins) {
      return this.renderLoadingScreen();
    }

    // Get active tab
    const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
    
    // Get figure factory
    const figureFactory = this.factoryManager.get('figures');
    
    // Get available figure types
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
          />
        </div>
      </div>
    );
  }
}