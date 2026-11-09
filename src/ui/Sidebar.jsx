import React from 'react';
import Select from 'react-select';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import ApplicationSettingsModal from './modals/ApplicationSettingsModal';
import LayoutManagementModal from './modals/LayoutManagementModal';
import PluginManagementModal from './modals/PluginManagementModal';
import PluginRegistrationModal from './modals/PluginRegistrationModal';

const MINIMUM_WIDTH = 48;
const MINIMUM_ZOOM = 0.2;
const MAXIMUM_ZOOM = 5;
const ZOOM_STEP = 0.1;

const clampZoom = (value) => Math.min(MAXIMUM_ZOOM, Math.max(MINIMUM_ZOOM, value));

export default class Sidebar extends React.Component {
  state = {
    selectedFigureType: '',
    collapsed: false,
    width: 240,
    resizing: false,
    lastPointerX: 0,
    activeModal: null,
    zoomInput: null,
  };

  componentDidUpdate(previousProps) {
    if (previousProps.zoom !== this.props.zoom && this.state.zoomInput !== null) {
      this.setState({ zoomInput: null });
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleResize);
    document.removeEventListener('mouseup', this.stopResize);
  }

  setModal = (activeModal) => this.setState({ activeModal });

  toggleCollapse = () => {
    this.setState(
      (state) => ({ collapsed: !state.collapsed }),
      () => this.props.onCollapse?.(this.state.collapsed)
    );
  };

  addSelectedFigure = () => {
    if (this.state.selectedFigureType) {
      this.props.onAddFigure(this.state.selectedFigureType);
    }
  };

  startResize = (event) => {
    this.setState({ resizing: true, lastPointerX: event.clientX });
    document.addEventListener('mousemove', this.handleResize);
    document.addEventListener('mouseup', this.stopResize);
  };

  handleResize = (event) => {
    if (!this.state.resizing) return;
    const delta = event.clientX - this.state.lastPointerX;
    this.setState((state) => ({
      width: Math.max(MINIMUM_WIDTH, state.width + delta),
      lastPointerX: event.clientX,
    }));
  };

  stopResize = () => {
    this.setState({ resizing: false });
    document.removeEventListener('mousemove', this.handleResize);
    document.removeEventListener('mouseup', this.stopResize);
  };

  handlePluginOperation = (operation, data = {}) => {
    const handlers = {
      remove: () => this.props.onRemovePlugin?.(data.pluginId),
      export: () => this.props.onExportPlugins?.(),
      import: () => this.props.onImportPlugins?.(data.jsonString),
      clear: () => this.props.onClearPlugins?.(),
      reset: () => this.props.onResetPlugins?.(),
      load: () => this.props.onLoadPlugin?.(data.pluginId),
    };
    handlers[operation]?.();
  };

  handleLayoutOperation = (operation, data = {}) => {
    const handlers = {
      exportLayout: () => this.props.onExportLayout?.(),
      importLayout: () => this.props.onImportLayout?.(data.jsonString),
      clearLayout: () => this.props.onClearLayout?.(),
      resetLayout: () => this.props.onResetLayout?.(),
      exportTab: () => this.props.onExportTab?.(),
      importTab: () => this.props.onImportTab?.(data.jsonString),
    };
    handlers[operation]?.();
  };

  handleApplicationSettings = ({ syncMode }) => {
    this.props.onSyncModeChange?.(syncMode);
    this.setModal(null);
  };

  changeZoom = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return;
    this.props.onZoomChange?.(Number(clampZoom(numericValue).toFixed(2)));
  };

  applyZoomInput = () => {
    const percent = Number(this.state.zoomInput);
    if (!Number.isFinite(percent)) return;
    this.changeZoom(percent / 100);
    this.setState({ zoomInput: null });
  };

  figureOptions() {
    const options = this.props.figureTypes.map(([name, FigureClass]) => ({
      value: name,
      label: FigureClass.displayName || FigureClass.name || name,
    }));
    const labels = options.map(({ label }) => label);
    const duplicates = labels.filter((label, index) => labels.indexOf(label) !== index);
    if (duplicates.length) console.warn('Duplicate figure display names:', [...new Set(duplicates)]);
    return options;
  }

  render() {
    const {
      plugins = [],
      tabs = [],
      activeTabId,
      syncMode = true,
      zoom = 1,
      isMobile = false,
      onCloseMobile,
    } = this.props;
    const { selectedFigureType, collapsed, width, activeModal, zoomInput } = this.state;
    const isCollapsed = !isMobile && collapsed;
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    const currentZoom = clampZoom(Number(zoom) || 1);
    const defaultZoom = clampZoom(Number(activeTab?.defaultZoom) || 1);
    const zoomInputValue = zoomInput ?? Math.round(currentZoom * 100);
    const zoomInputValid = zoomInput !== null
      && zoomInput !== ''
      && Number.isFinite(Number(zoomInput));
    const options = this.figureOptions();

    return (
      <aside
        className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{ width: isMobile ? '100%' : isCollapsed ? MINIMUM_WIDTH : width }}
      >
        <header className="sidebar-header">
          {!isCollapsed && <h2>Controls</h2>}
          <button
            className="icon-button"
            type="button"
            onClick={isMobile ? onCloseMobile : this.toggleCollapse}
            aria-label={isMobile ? 'Close controls' : 'Toggle sidebar'}
          >
            {isMobile ? 'Close' : collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
        </header>

        {!isCollapsed && (
          <div className="sidebar-content">
            <section className="sidebar-section">
              <h3>Figures</h3>
              <Select
                value={options.find(({ value }) => value === selectedFigureType) || null}
                onChange={(option) => this.setState({ selectedFigureType: option?.value || '' })}
                options={options}
                placeholder="Select figure…"
                isClearable
              />
              <button
                className="button button-primary button-block"
                type="button"
                onClick={this.addSelectedFigure}
                disabled={!selectedFigureType}
              >
                Add figure
              </button>
            </section>

            <section className="sidebar-section">
              <h3>Workspace</h3>
              <div className="sidebar-zoom" aria-label="Canvas zoom controls">
                <button
                  className="button button-secondary sidebar-zoom-step"
                  type="button"
                  onClick={() => this.changeZoom(currentZoom - ZOOM_STEP)}
                  disabled={currentZoom <= MINIMUM_ZOOM}
                  aria-label="Zoom out"
                >
                  −
                </button>
                <input
                  type="range"
                  min={MINIMUM_ZOOM * 100}
                  max={MAXIMUM_ZOOM * 100}
                  value={Math.round(currentZoom * 100)}
                  onChange={(event) => this.changeZoom(Number(event.target.value) / 100)}
                  aria-label="Canvas zoom"
                />
                <button
                  className="button button-secondary sidebar-zoom-step"
                  type="button"
                  onClick={() => this.changeZoom(currentZoom + ZOOM_STEP)}
                  disabled={currentZoom >= MAXIMUM_ZOOM}
                  aria-label="Zoom in"
                >
                  +
                </button>
              </div>
              <div className="sidebar-zoom-manual">
                <input
                  className="sidebar-zoom-input"
                  type="number"
                  min={MINIMUM_ZOOM * 100}
                  max={MAXIMUM_ZOOM * 100}
                  value={zoomInputValue}
                  onChange={(event) => this.setState({ zoomInput: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      this.applyZoomInput();
                    }
                  }}
                  aria-label="Canvas zoom percent"
                />
                <span>%</span>
                <button
                  className="button button-secondary sidebar-zoom-action"
                  type="button"
                  onClick={this.applyZoomInput}
                  disabled={!zoomInputValid}
                >
                  Apply
                </button>
                <button
                  className="button button-secondary sidebar-zoom-action"
                  type="button"
                  onClick={() => this.changeZoom(defaultZoom)}
                >
                  Reset
                </button>
              </div>
              <button className="button button-secondary button-block" type="button" onClick={() => this.setModal('layout')}>
                Manage layout
              </button>
              <button className="button button-secondary button-block" type="button" onClick={() => this.setModal('settings')}>
                Settings
              </button>
            </section>

            <section className="sidebar-section">
              <h3>Plugins</h3>
              <button className="button button-secondary button-block" type="button" onClick={() => this.setModal('register-plugin')}>
                Add plugin
              </button>
              <button className="button button-secondary button-block" type="button" onClick={() => this.setModal('plugins')}>
                Manage plugins
              </button>
            </section>

          </div>
        )}

        {!isCollapsed && !isMobile && <div className="sidebar-resize-handle" onMouseDown={this.startResize} />}

        <ApplicationSettingsModal
          visible={activeModal === 'settings'}
          syncMode={syncMode}
          onApply={this.handleApplicationSettings}
          onClose={() => this.setModal(null)}
        />
        <PluginRegistrationModal
          visible={activeModal === 'register-plugin'}
          onRegister={(pluginInfo) => this.props.onAddPlugin?.(pluginInfo)}
          onClose={() => this.setModal(null)}
        />
        <PluginManagementModal
          visible={activeModal === 'plugins'}
          plugins={plugins}
          onManage={this.handlePluginOperation}
          onClose={() => this.setModal(null)}
        />
        <LayoutManagementModal
          visible={activeModal === 'layout'}
          tabs={tabs}
          activeTabId={activeTabId}
          onManage={this.handleLayoutOperation}
          onClose={() => this.setModal(null)}
        />
      </aside>
    );
  }
}
