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
    zoomInput: null,

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

  componentDidUpdate(prevProps) {
    if (prevProps.zoom !== this.props.zoom) {
      this.setState((prevState) =>
        prevState.zoomInput === null ? null : { zoomInput: null }
      );
    }
  }

  handleZoomInputChange = (e) => {
    this.setState({ zoomInput: e.target.value });
  };

  handleZoomInputApply = () => {
    const { zoomInput } = this.state;
    if (zoomInput === null || zoomInput === '') return;
    const percentValue = parseFloat(zoomInput);
    if (!Number.isFinite(percentValue)) return;
    const clampedPercent = Math.min(500, Math.max(20, percentValue));
    const zoomValue = clampedPercent / 100;
    this.props.onZoomChange?.(parseFloat(zoomValue.toFixed(3)));
    this.setState({ zoomInput: null });
  };

  render() {
    const { 
      figureTypes, 
      plugins = [], 
      tabs = [], 
      activeTabId, 
      activeFigureId,
      syncMode = true,
      zoom = 1,
      onZoomChange = () => {},
      isMobile = false,
      onCloseMobile,
    } = this.props;
    const {
      selectedFigureType,
      collapsed,
      width,
      showPluginRegistrationModal,
      showPluginManagementModal,
      showLayoutManagementModal,
      zoomInput,
    } = this.state;
    const isCollapsed = isMobile ? false : collapsed;

    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    const MIN_ZOOM = 0.2;
    const MAX_ZOOM = 5;
    const currentZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, typeof zoom === 'number' ? zoom : 1));
    const defaultZoomValue = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, typeof activeTab?.defaultZoom === 'number' ? activeTab.defaultZoom : 1)
    );
    const zoomInputValue =
      zoomInput !== null
        ? zoomInput
        : Math.round(currentZoom * 100).toString();
    const zoomInputValid = zoomInput !== null && zoomInput !== '' && Number.isFinite(parseFloat(zoomInput));

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
          width: isMobile ? '100%' : isCollapsed ? 48 : width,
          minWidth: isMobile ? 'auto' : 48,
          padding: isMobile ? '1rem' : isCollapsed ? '0.5rem 0' : '1rem',
          borderRight: isMobile ? 'none' : '1px solid #ccc',
          backgroundColor: '#f8f8f8',
          height: isMobile ? '100%' : '100vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMobile ? 'stretch' : isCollapsed ? 'center' : 'stretch',
          transition: 'width 0.2s, padding 0.2s',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile ? 'space-between' : isCollapsed ? 'center' : 'space-between',
            marginBottom: isMobile ? '1rem' : isCollapsed ? 0 : '1rem',
            paddingBottom: isMobile ? '0.5rem' : isCollapsed ? 0 : '0.5rem',
            borderBottom: isMobile ? '1px solid #ddd' : isCollapsed ? 'none' : '1px solid #ddd',
            width: '100%',
          }}
        >
          {!isCollapsed && <h3 style={{ margin: 0 }}>Controls</h3>}
          {isMobile ? (
            <button
              onClick={onCloseMobile}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#111827',
              }}
            >
              Close
            </button>
          ) : (
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
          )}
        </div>

        {/* Main content */}
        {(!isCollapsed || isMobile) && (
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
              <h3>Canvas Zoom</h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}>
                <button
                  onClick={() => onZoomChange(Math.max(MIN_ZOOM, +(currentZoom - 0.1).toFixed(2)))}
                  disabled={currentZoom <= MIN_ZOOM}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: 4,
                    border: '1px solid #111827',
                    background: '#fff',
                    color: '#111827',
                    cursor: currentZoom <= MIN_ZOOM ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    opacity: currentZoom <= MIN_ZOOM ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => {
                    if (currentZoom > MIN_ZOOM) {
                      e.target.style.background = '#111827';
                      e.target.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#fff';
                    e.target.style.color = '#111827';
                  }}
                >
                  −
                </button>
                <input
                  type="range"
                  min={20}
                  max={500}
                  value={Math.round(currentZoom * 100)}
                  onChange={(e) => {
                    const sliderValue = parseInt(e.target.value, 10);
                    if (Number.isNaN(sliderValue)) {
                      return;
                    }
                    onZoomChange(
                      Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, sliderValue / 100))
                    );
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    accentColor: '#111827',
                  }}
                />
                <button
                  onClick={() => onZoomChange(Math.min(MAX_ZOOM, +(currentZoom + 0.1).toFixed(2)))}
                  disabled={currentZoom >= MAX_ZOOM}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: 4,
                    border: '1px solid #111827',
                    background: '#fff',
                    color: '#111827',
                    cursor: currentZoom >= MAX_ZOOM ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    opacity: currentZoom >= MAX_ZOOM ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => {
                    if (currentZoom < MAX_ZOOM) {
                      e.target.style.background = '#111827';
                      e.target.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#fff';
                    e.target.style.color = '#111827';
                  }}
                >
                  +
                </button>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontWeight: 500,
                }}>
                  {Math.round(currentZoom * 100)}%
                </div>
                <input
                  type="number"
                  min={20}
                  max={500}
                  value={zoomInputValue}
                  onChange={this.handleZoomInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      this.handleZoomInputApply();
                    }
                  }}
                  style={{
                    width: 70,
                    padding: '0.25rem 0.4rem',
                    border: '1px solid #d1d5db',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>%</span>
                <button
                  onClick={this.handleZoomInputApply}
                  disabled={!zoomInputValid}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: 4,
                    border: '1px solid #111827',
                    background: zoomInputValid ? '#111827' : '#fff',
                    color: zoomInputValid ? '#fff' : '#111827',
                    cursor: zoomInputValid ? 'pointer' : 'not-allowed',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    lineHeight: 1,
                    opacity: zoomInputValid ? 1 : 0.6,
                  }}
                >
                  Apply
                </button>
                <button
                  onClick={() => onZoomChange(defaultZoomValue)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: 4,
                    border: '1px solid #111827',
                    background: '#fff',
                    color: '#111827',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#111827';
                    e.target.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#fff';
                    e.target.style.color = '#111827';
                  }}
                >
                  Reset
                </button>
              </div>
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
        {!isCollapsed && !isMobile && (
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
