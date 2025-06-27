import React from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

class Sidebar extends React.Component {
  fileInputRef = React.createRef();
  tabFileInputRef = React.createRef();

  state = {
    selectedFigureType: '',
    collapsed: false,
    newPluginUrl: '',  // <-- added state for plugin URL input
  };

  onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      this.props.onImport(evt.target.result);
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  onTabFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      this.props.onImportTab(evt.target.result);
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  onFigureTypeChange = (e) => {
    this.setState({ selectedFigureType: e.target.value });
  };

  onAddSelectedFigure = () => {
    if (this.state.selectedFigureType) {
      this.props.onAddFigure(this.state.selectedFigureType);
      this.setState({ selectedFigureType: '' });
    }
  };

  toggleCollapse = () => {
    this.setState(
      (state) => ({ collapsed: !state.collapsed }),
      () => {
        this.props.onCollapse?.(this.state.collapsed);
      }
    );
  };

  onPluginUrlChange = (e) => {
    this.setState({ newPluginUrl: e.target.value });
  };

  onAddPluginClick = () => {
    const url = this.state.newPluginUrl.trim();
    if (!url) return;
    this.props.onAddPluginUrl?.(url);
    this.setState({ newPluginUrl: '' });
  };

  render() {
    const {
      figureTypes, // expect: Array<[name: string, cls: class]>
      onExport,
      onExportActiveTab,
      onClearLayout,
      onResetLayout,
      onClearPlugins
    } = this.props;
    const { selectedFigureType, collapsed, newPluginUrl } = this.state;

    // Extract display names from classes, keyed by name
    // figureTypes: [ [name, class], ... ]
    const displayNames = figureTypes.map(
      ([name, cls]) => cls.displayName || cls.name || name || 'UnnamedFigure'
    );

    // Count duplicates for display names
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

    // Track how many times we have seen each display name (to disambiguate keys)
    const seen = {};

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
            <h3
              style={{ margin: 0, fontWeight: '600', fontSize: '1.2rem' }}
            >
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
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#e0e0e0')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'transparent')
            }
          >
            {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
        </div>

        {!collapsed && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <h4>Global Layout</h4>
              <button
                onClick={onExport}
                style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
              >
                Export All Tabs
              </button>
              <button
                onClick={() => this.fileInputRef.current?.click()}
                style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
              >
                Import Layout (Replace All)
              </button>
              <button
                onClick={onResetLayout}
                style={{
                  width: '100%',
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#e8f0fe',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c2d1ff')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e8f0fe')}
              >
                Reset to Default Layout
              </button>
              <button
                onClick={onClearLayout}
                style={{
                  width: '100%',
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#fdd',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fdd')}
              >
                Clear All Tabs
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4>Active Tab</h4>
              <button
                onClick={onExportActiveTab}
                style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
              >
                Export Current Tab
              </button>
              <button
                onClick={() => this.tabFileInputRef.current?.click()}
                style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
              >
                Import Tab (Append)
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h3>Available Figures</h3>
              <select
                value={selectedFigureType}
                onChange={this.onFigureTypeChange}
                style={{ width: '100%', marginBottom: '0.5rem', padding: '0.4rem' }}
              >
                <option value="" disabled>
                  Select a figure type...
                </option>
                {figureTypes.map(([name, cls]) => {
                  const displayName = cls.displayName || cls.name || name || 'UnnamedFigure';
                  seen[displayName] = (seen[displayName] || 0) + 1;
                  const key = counts[displayName] > 1 ? `${displayName}_${seen[displayName]}` : displayName;

                  return (
                    <option key={key} value={name}>
                      {key}
                    </option>
                  );
                })}
              </select>
              <button
                onClick={this.onAddSelectedFigure}
                disabled={!selectedFigureType}
                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
              >
                Add Figure
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4>Load Plugin</h4>
              <input
                type="text"
                placeholder="Enter plugin URL..."
                value={newPluginUrl}
                onChange={this.onPluginUrlChange}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  marginBottom: '0.5rem',
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={this.onAddPluginClick}
                disabled={!newPluginUrl.trim()}
                style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
              >
                Add Plugin
              </button>
              <button
                onClick={onClearPlugins}
                style={{
                  width: '100%',
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#fdd',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fdd')}
              >
                Clear All Plugins
              </button>
            </div>
          </>
        )}

        <input
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          ref={this.fileInputRef}
          onChange={this.onFileChange}
        />
        <input
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          ref={this.tabFileInputRef}
          onChange={this.onTabFileChange}
        />
      </div>
    );
  }
}

export default Sidebar;