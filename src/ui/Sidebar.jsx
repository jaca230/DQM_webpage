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
    width: 220,
    resizing: false,
    lastX: 0,

    // Modal visibility
    showPluginRegistrationModal: false,
    showPluginManagementModal: false,
    showLayoutManagementModal: false,
  };

  // Figure type selection
  onFigureTypeChange = (option) =>
    this.setState({ selectedFigureType: option?.value || '' });

  onAddSelectedFigure = () => {
    const { selectedFigureType } = this.state;
    if (selectedFigureType) {
      this.props.onAddFigure(selectedFigureType);
      // Keep selection to allow adding multiple copies
    }
  };

  // Collapse toggle
  toggleCollapse = () => this.setState((s) => ({ collapsed: !s.collapsed }));

  // Sync mode toggle
  handleSyncModeToggle = () => {
    const newSyncMode = !this.props.syncMode;
    this.props.onSyncModeChange?.(newSyncMode);
  };

  // Plugin modal controls
  openPluginRegistrationModal = () => this.setState({ showPluginRegistrationModal: true });
  closePluginRegistrationModal = () => this.setState({ showPluginRegistrationModal: false });
  openPluginManagementModal = () => this.setState({ showPluginManagementModal: true });
  closePluginManagementModal = () => this.setState({ showPluginManagementModal: false });
  openLayoutManagementModal = () => this.setState({ showLayoutManagementModal: true });
  closeLayoutManagementModal = () => this.setState({ showLayoutManagementModal: false });

  // Plugin and layout callbacks
  onRegisterPlugin = (pluginInfo) => this.props.onAddPlugin?.(pluginInfo);
  onRemovePlugin = (pluginId) => this.props.onRemovePlugin?.(pluginId);

  onManagePlugins = (operation, data) => {
    switch (operation) {
      case 'remove': return this.props.onRemovePlugin?.(data.pluginId);
      case 'export': return this.props.onExportPlugins?.();
      case 'import': return this.props.onImportPlugins?.(data.jsonString);
      case 'clear': return this.props.onClearPlugins?.();
      case 'reset': return this.props.onResetPlugins?.();
      case 'load': return this.props.onLoadPlugin?.(data.pluginId);
      default: console.warn('Unknown plugin management operation:', operation);
    }
  };

  onManageLayout = (operation, data) => {
    switch (operation) {
      case 'exportLayout': return this.props.onExportLayout?.();
      case 'importLayout': return this.props.onImportLayout?.(data.jsonString);
      case 'clearLayout': return this.props.onClearLayout?.();
      case 'resetLayout': return this.props.onResetLayout?.();
      case 'exportTab': return this.props.onExportTab?.();
      case 'importTab': return this.props.onImportTab?.(data.jsonString);
      default: console.warn('Unknown layout management operation:', operation);
    }
  };

  // Drag to resize
  onMouseDown = (e) => {
    this.setState({ resizing: true, lastX: e.clientX });
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  };

  onMouseMove = (e) => {
    if (!this.state.resizing) return;
    const delta = e.clientX - this.state.lastX;
    this.setState((s) => ({
      width: Math.max(48, s.width + delta),
      lastX: e.clientX,
    }));
  };

  onMouseUp = () => {
    this.setState({ resizing: false });
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  render() {
    const { 
      figureTypes, 
      plugins = [], 
      tabs = [], 
      activeTabId, 
      activeFigureId,
      syncMode = true
    } = this.props;
    const {
      selectedFigureType,
      collapsed,
      width,
      showPluginRegistrationModal,
      showPluginManagementModal,
      showLayoutManagementModal,
    } = this.state;

    const options = figureTypes.map(([name, cls]) => ({
      value: name,
      label: cls.displayName || cls.name || name || 'UnnamedFigure',
    }));

    const displayNames = options.map((opt) => opt.label);
    const counts = {};
    displayNames.forEach((name) => (counts[name] = (counts[name] || 0) + 1));
    if (Object.values(counts).some((c) => c > 1)) {
      console.warn(
        'Duplicate figure type display names:',
        Object.entries(counts).filter(([, c]) => c > 1).map(([name]) => name)
      );
    }

    return (
      <div
        style={{
          width: collapsed ? 48 : width,
          minWidth: 48,
          padding: collapsed ? '0.5rem 0' : '1rem',
          borderRight: '1px solid #ccc',
          backgroundColor: '#f8f8f8',
          height: '100vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: collapsed ? 'center' : 'stretch',
          transition: 'width 0.2s, padding 0.2s',
          position: 'relative',
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
          }}
        >
          {!collapsed && <h3 style={{ margin: 0 }}>Sidebar</h3>}
          <button
            onClick={this.toggleCollapse}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Toggle sidebar collapse"
          >
            {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
        </div>

        {/* Main content */}
        {!collapsed && (
          <>
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
                onChange={this.onFigureTypeChange}
                options={options}
                placeholder="Select Figure.."
                isClearable
                styles={{
                  option: (base, { data }) => ({
                    ...base,
                    backgroundColor:
                      activeFigureId === data.value ? '#d0ebff' : base.backgroundColor,
                    fontWeight: activeFigureId === data.value ? 'bold' : base.fontWeight,
                  }),
                }}
              />
              <button
                onClick={this.onAddSelectedFigure}
                disabled={!selectedFigureType}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
              >
                Add Figure
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h3>Layout</h3>
              <button
                onClick={this.openLayoutManagementModal}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                Manage Layout
              </button>
            </div>

            <h3>Plugins</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button onClick={this.openPluginRegistrationModal} style={{ padding: '0.5rem' }}>
                Add Plugin
              </button>
              <button onClick={this.openPluginManagementModal} style={{ padding: '0.5rem' }}>
                Manage Plugins
              </button>
            </div>

            {/* Data Sync Mode Toggle */}
            <div style={{ marginBottom: '1rem' }}>
              <h3>Data Sync</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={syncMode}
                    onChange={this.handleSyncModeToggle}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Sync Mode
                </label>
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#666', 
                marginTop: '0.25rem',
                lineHeight: '1.3'
              }}>
                {syncMode 
                  ? 'Figures wait for their interval but share fastest fetch rate'
                  : 'Each figure fetches independently (more requests)'
                }
              </div>
            </div>
          </>
        )}

        {/* Resize handle */}
        {!collapsed && (
          <div
            onMouseDown={this.onMouseDown}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 5,
              height: '100%',
              cursor: 'ew-resize',
              zIndex: 10,
            }}
          />
        )}

        {/* Modals */}
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