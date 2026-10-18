import React from 'react';
import Select from 'react-select';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import ApplicationSettingsModal from './modals/ApplicationSettingsModal';
import LayoutManagementModal from './modals/LayoutManagementModal';
import PluginManagementModal from './modals/PluginManagementModal';
import PluginRegistrationModal from './modals/PluginRegistrationModal';

const MINIMUM_WIDTH = 48;

export default class Sidebar extends React.Component {
  state = {
    selectedFigureType: '',
    collapsed: false,
    width: 240,
    resizing: false,
    lastPointerX: 0,
    activeModal: null,
  };

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

  handleApplicationSettings = ({ syncMode, zoom }) => {
    this.props.onSyncModeChange?.(syncMode);
    this.props.onZoomChange?.(zoom);
    this.setModal(null);
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
    const { selectedFigureType, collapsed, width, activeModal } = this.state;
    const isCollapsed = !isMobile && collapsed;
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
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
          zoom={zoom}
          defaultZoom={activeTab?.defaultZoom || 1}
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
