import React from 'react';
import FigureTitle from './FigureTitle';
import { Move, Settings } from 'lucide-react';
import SettingsMenu from './SettingsMenu';

export default class FigureTile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showMenu: false,
      tempSettings: null,
    };
  }

  componentDidUpdate(prevProps) {
    if (
      this.state.showMenu &&
      prevProps.settings !== this.props.settings
    ) {
      this.setState({ tempSettings: { ...this.props.settings } });
    }
  }

  toggleMenu = (e) => {
    e.stopPropagation();
    // Bring figure to front before toggling menu
    this.props.onBringToFront?.();
    this.setState((prev) => {
      if (!prev.showMenu) {
        return { showMenu: true, tempSettings: { ...this.props.settings } };
      } else {
        return { showMenu: false, tempSettings: null };
      }
    });
  };

  handleDelete = (e) => {
    e.stopPropagation();
    this.props.onDelete();
  };

  handleSettingChange = (key, value) => {
    this.setState((prev) => ({
      tempSettings: { ...prev.tempSettings, [key]: value },
    }));
  };

  applySettings = () => {
    if (this.state.tempSettings) {
      this.props.onSettingsChange(this.state.tempSettings);
    }
    this.setState({ showMenu: false, tempSettings: null });
  };

  onTitleChange = (newTitle) => {
    this.props.onTitleChange(newTitle);
  };

  render() {
    const { title, children, schema = {} } = this.props;
    const { showMenu, tempSettings } = this.state;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '0.5rem',
          background: '#fff',
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          userSelect: 'none',
          cursor: 'default',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.5rem',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexGrow: 1,
              flexShrink: 1,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <button
              className="no-drag"
              onClick={this.toggleMenu}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Options"
              aria-label="Toggle settings menu"
            >
              <Settings size={16} strokeWidth={2} />
            </button>

            <FigureTitle title={title} onChange={this.onTitleChange} />
          </div>

          <div
            className="drag-handle"
            style={{
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '0.5rem',
              flexShrink: 0,
            }}
            title="Drag tile"
          >
            <Move size={16} strokeWidth={2} />
          </div>
        </div>

        {/* Settings menu */}
        {showMenu && tempSettings && (
          <SettingsMenu
            settings={tempSettings}
            schema={schema}
            onChange={this.handleSettingChange}
            onApply={this.applySettings}
            onDelete={this.handleDelete}
          />
        )}

        {/* Content */}
        <div style={{ flexGrow: 1, overflow: 'hidden', height: 'calc(100% - 2.5rem)' }}>
          {children}
        </div>
      </div>
    );
  }
}
