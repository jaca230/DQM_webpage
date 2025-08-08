import React from 'react';
import { Rnd } from 'react-rnd';
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

  onDragStop = (e, d) => {
    this.props.onDragStop(d);
  };

  onResizeStop = (e, direction, ref, delta, position) => {
    this.props.onResizeStop(ref, position);
  };

  render() {
    const { title, children, schema = {}, x, y, width, height, zIndex } = this.props;
    const { showMenu, tempSettings } = this.state;

    return (
      <Rnd
        size={{ width, height }}
        position={{ x, y }}
        onDragStop={this.onDragStop}
        onResizeStop={this.onResizeStop}
        bounds="parent"
        dragHandleClassName="drag-handle"
        enableResizing={{
          top: true,
          right: true,
          bottom: true,
          left: true,
          topRight: true,
          bottomRight: true,
          bottomLeft: true,
          topLeft: true,
        }}
        style={{
          border: '1px solid #aaa',
          background: 'white',
          borderRadius: 6,
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          zIndex,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '8px',
            padding: '0.5rem',
            background: '#fff',
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
      </Rnd>
    );
  }
}
