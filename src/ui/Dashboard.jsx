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

    // Try loading from localStorage
    let savedState = null;
    try {
      const saved = localStorage.getItem('dashboard-layout');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if the layout has meaningful content
        if (parsed.tabs && parsed.activeTabId && 
            parsed.tabs.some(tab => tab.figures.length > 0)) {
          savedState = {
            tabs: parsed.tabs,
            activeTabId: parsed.activeTabId,
            sidebarCollapsed: false
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load saved layout from localStorage:', e);
    }

    // Use default layout if no saved state or empty layout
    this.state = savedState || {
      activeTabId: defaultLayout.activeTabId,
      tabs: JSON.parse(JSON.stringify(defaultLayout.tabs)),
      sidebarCollapsed: false
    };
  }

  findNextFreePosition(layout, w, h, step = 20) {
    let y = 0;
    while (y < 10000) {
      for (let x = 0; x < 3000; x += step) {
        const collides = layout.some(item => {
          const xOverlap = x < item.x + item.width && x + w > item.x;
          const yOverlap = y < item.y + item.height && y + h > item.y;
          return xOverlap && yOverlap;
        });
        if (!collides) {
          return { x, y };
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
      this.setState({
        activeTabId: 'tab1',
        tabs: [{
          id: 'tab1',
          name: 'Default Tab',
          figures: [],
          layout: []
        }]
      });
      localStorage.removeItem('dashboard-layout');
    }
  };

  handleResetLayout = () => {
    if (window.confirm('Are you sure you want to reset to the default layout?')) {
      this.setState({
        activeTabId: defaultLayout.activeTabId,
        tabs: JSON.parse(JSON.stringify(defaultLayout.tabs))
      });
      localStorage.setItem('dashboard-layout', JSON.stringify(defaultLayout));
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

  handleImport = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      this.fromJSON(parsed);
      localStorage.setItem('dashboard-layout', JSON.stringify(parsed));
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

  toJSON = () => ({
    activeTabId: this.state.activeTabId,
    tabs: this.state.tabs
  });

  fromJSON = (json) => {
    if (json && json.tabs && Array.isArray(json.tabs)) {
      this.setState({
        activeTabId: json.activeTabId || json.tabs[0].id,
        tabs: json.tabs
      });
    } else {
      alert('Invalid layout JSON');
    }
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.tabs !== this.state.tabs ||
      prevState.activeTabId !== this.state.activeTabId
    ) {
      try {
        localStorage.setItem(
          'dashboard-layout',
          JSON.stringify({
            tabs: this.state.tabs,
            activeTabId: this.state.activeTabId
          })
        );
      } catch (e) {
        console.warn('Failed to save layout to localStorage:', e);
      }
    }
  }

  render() {
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
            figureTypes={this.registryManager.get('figures').getNames()}
            onAddFigure={this.handleAddFigure}
            onExport={this.handleExport}
            onExportActiveTab={this.handleExportActiveTab}
            onImport={this.handleImport}
            onImportTab={this.handleImportTab}
            onClearLayout={this.handleClearLayout}
            onResetLayout={this.handleResetLayout}
            onCollapse={this.handleSidebarCollapse}
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