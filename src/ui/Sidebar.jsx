import React from 'react';
import Select from 'react-select';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import PluginRegistrationModal from './modals/PluginRegistrationModal';
import PluginManagementModal from './modals/PluginManagementModal';
import LayoutManagementModal from './modals/LayoutManagementModal';

class Sidebar extends React.Component {
  state = {
    selectedFigureType: '',
    collapsed: false,

    // Modal visibility states
    showPluginRegistrationModal: false,
    showPluginManagementModal: false,
    showLayoutManagementModal: false,
  };

  // Figure type selection handlers
  onFigureTypeChange = (e) => {
    this.setState({ selectedFigureType: e.target.value });
  };

  onAddSelectedFigure = () => {
    if (this.state.selectedFigureType) {
      this.props.onAddFigure(this.state.selectedFigureType);
      this.setState({ selectedFigureType: '' });
    }
  };

  // Sidebar collapse toggle
  toggleCollapse = () => {
    this.setState(
      (state) => ({ collapsed: !state.collapsed }),
      () => {
        this.props.onCollapse?.(this.state.collapsed);
      }
    );
  };

  // Plugin registration modal controls
  openPluginRegistrationModal = () => {
    this.setState({ showPluginRegistrationModal: true });
  };

  closePluginRegistrationModal = () => {
    this.setState({ showPluginRegistrationModal: false });
  };

  // Plugin management modal controls
  openPluginManagementModal = () => {
    this.setState({ showPluginManagementModal: true });
  };

  closePluginManagementModal = () => {
    this.setState({ showPluginManagementModal: false });
  };

  // Layout management modal controls
  openLayoutManagementModal = () => {
    this.setState({ showLayoutManagementModal: true });
  };

  closeLayoutManagementModal = () => {
    this.setState({ showLayoutManagementModal: false });
  };

  // Callback when new plugin registered in modal
  onRegisterPlugin = (pluginInfo) => {
    return this.props.onAddPlugin?.(pluginInfo); // Let modal handle success UI and closing
  };

  // Callback when plugin removed from management modal
  onRemovePlugin = (pluginId) => {
    this.props.onRemovePlugin?.(pluginId);
  };

  // Callback for plugin management operations
  onManagePlugins = (operation, data) => {
    switch (operation) {
      case 'remove':
        this.props.onRemovePlugin?.(data.pluginId);
        break;
      case 'export':
        this.props.onExportPlugins?.();
        break;
      case 'import':
        this.props.onImportPlugins?.(data.jsonString);
        break;
      case 'clear':
        this.props.onClearPlugins?.();
        break;
      case 'reset':
        this.props.onResetPlugins?.();
        break;
      case 'load':
        this.props.onLoadPlugin?.(data.pluginId);
        break;
      default:
        console.warn('Unknown plugin management operation:', operation);
    }
  };

  // Callback for layout management operations
  onManageLayout = (operation, data) => {
    switch (operation) {
      case 'exportLayout':
        this.props.onExportLayout?.();
        break;
      case 'importLayout':
        this.props.onImportLayout?.(data.jsonString);
        break;
      case 'clearLayout':
        this.props.onClearLayout?.();
        break;
      case 'resetLayout':
        this.props.onResetLayout?.();
        break;
      case 'exportTab':
        this.props.onExportTab?.();
        break;
      case 'importTab':
        this.props.onImportTab?.(data.jsonString);
        break;
      default:
        console.warn('Unknown layout management operation:', operation);
    }
  };

  render() {
    const {
      figureTypes,
      plugins = [],
      tabs = [],
      activeTabId,
    } = this.props;

    const {
      selectedFigureType,
      collapsed,
      showPluginRegistrationModal,
      showPluginManagementModal,
      showLayoutManagementModal,
    } = this.state;

    // Prepare display names and handle duplicates
    const displayNames = figureTypes.map(
      ([name, cls]) => cls.displayName || cls.name || name || 'UnnamedFigure'
    );

    const counts = {};
    displayNames.forEach((name) => {
      counts[name] = (counts[name] || 0) + 1;
    });

    if (Object.values(counts).some((count) => count > 1)) {
      console.warn(
        'Duplicate figure type display names detected:',
        Object.entries(counts)
          .filter(([, count]) => count > 1)
          .map(([name]) => name)
      );
    }

    return (
      <div
        style={{
          width: collapsed ? 48 : 220,
          padding: collapsed ? '0.5rem 0' : '1rem',
          borderRight: '1px solid #ccc',
          backgroundColor: '#f8f8f8',
          height: '100vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
          transition: 'width 0.3s, padding 0.3s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: collapsed ? 'center' : 'stretch',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            marginBottom: collapsed ? 0 : '1rem',
            paddingBottom: collapsed ? 0 : '0.5rem',
            borderBottom: collapsed ? 'none' : '1px solid #ddd',
            width: '100%',
            userSelect: 'none',
          }}
        >
          {!collapsed && (
            <h3 style={{ margin: 0, fontWeight: '600', fontSize: '1.2rem' }}>
              Sidebar
            </h3>
          )}
          <button
            onClick={this.toggleCollapse}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
              width: 32,
              height: 32,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'transparent')
            }
            aria-label="Toggle sidebar collapse"
          >
            {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
        </div>

        {/* Main content - hidden if collapsed */}
        {!collapsed && (
          <>
            {/* Available Figures */}
            <div style={{ marginBottom: '1rem' }}>
              <h3>Available Figures</h3>
              <Select
                value={
                  selectedFigureType
                    ? {
                        value: selectedFigureType,
                        label:
                          figureTypes.find(([name]) => name === selectedFigureType)?.[1]
                            .displayName || selectedFigureType,
                      }
                    : null
                }
                onChange={(option) =>
                  this.setState({ selectedFigureType: option?.value || '' })
                }
                options={figureTypes.map(([name, cls]) => ({
                  value: name,
                  label: cls.displayName || cls.name || name || 'UnnamedFigure',
                }))}
                placeholder="Select Figure.."
                isClearable
              />
              <button
                onClick={this.onAddSelectedFigure}
                disabled={!selectedFigureType}
                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
              >
                Add Figure
              </button>
            </div>

            {/* Layout Management */}
            <div style={{ marginBottom: '1rem' }}>
              <h3>Layout</h3>
              <button
                onClick={this.openLayoutManagementModal}
                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
                aria-label="Manage layout"
              >
                Manage Layout
              </button>
            </div>

            {/* Plugin Management Buttons */}
            <h3>Plugins</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={this.openPluginRegistrationModal}
                style={{ padding: '0.5rem' }}
                aria-label="Register new plugin"
              >
                Add Plugin
              </button>
              <button
                onClick={this.openPluginManagementModal}
                style={{ padding: '0.5rem' }}
                aria-label="Manage existing plugins"
              >
                Manage Plugins
              </button>
            </div>
          </>
        )}

        {/* Plugin modals */}
        <PluginRegistrationModal
          visible={showPluginRegistrationModal}
          onRegister={this.onRegisterPlugin}
          onClose={this.closePluginRegistrationModal}
        />
        <PluginManagementModal
          visible={showPluginManagementModal}
          plugins={plugins}
          onManage={this.onManagePlugins}
          onClose={this.closePluginManagementModal}
        />
        
        {/* Layout management modal */}
        <LayoutManagementModal
          visible={showLayoutManagementModal}
          tabs={tabs}
          activeTabId={activeTabId}
          onManage={this.onManageLayout}
          onClose={this.closeLayoutManagementModal}
        />
      </div>
    );
  }
}

export default Sidebar;