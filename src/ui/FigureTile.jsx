import React from 'react';
import FigureTitle from './FigureTitle';
import { Move, Settings } from 'lucide-react';

export default class FigureTile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showMenu: false,
      tempSettings: null, // initialized fresh on open
    };
  }

  toggleMenu = (e) => {
    e.stopPropagation();
    console.log('toggleMenu called, current showMenu:', this.state.showMenu);
    this.setState((prev) => {
      if (!prev.showMenu) {
        console.log('Opening menu with settings:', this.props.settings);
        return { showMenu: true, tempSettings: { ...this.props.settings } };
      } else {
        console.log('Closing menu');
        return { showMenu: false, tempSettings: null };
      }
    });
  };

  handleDelete = (e) => {
    e.stopPropagation();
    console.log('Delete button clicked');
    this.props.onDelete();
  };

  handleSettingChange = (key, value) => {
    console.log(`Setting changed: ${key} = ${value}`);
    this.setState((prev) => ({
      tempSettings: { ...prev.tempSettings, [key]: value },
    }));
  };

  applySettings = () => {
    console.log('Apply settings clicked', this.state.tempSettings);
    if (this.state.tempSettings) {
      this.props.onSettingsChange(this.state.tempSettings);
    }
    this.setState({ showMenu: false, tempSettings: null });
  };

  onTitleChange = (newTitle) => {
    console.log('Title changed:', newTitle);
    this.props.onTitleChange(newTitle);
  };

  render() {
    const { title, children } = this.props;
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
        {/* Header with drag handle, title, and settings button */}
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
            <div
              className="drag-handle"
              style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}
              title="Drag tile"
            >
              <Move size={16} strokeWidth={2} />
            </div>
            <FigureTitle title={title} onChange={this.onTitleChange} />
          </div>

          <div style={{ flexShrink: 0, marginLeft: '0.5rem' }}>
            <button
              className="no-drag"
              onClick={this.toggleMenu}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              title="Options"
              aria-label="Toggle settings menu"
            >
              <Settings size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Settings menu */}
        {showMenu && tempSettings && (
          <div
            className="no-drag"
            style={{
              position: 'absolute',
              top: '2.5rem',
              right: '0.5rem',
              background: '#eee',
              padding: '0.5rem',
              borderRadius: '4px',
              zIndex: 10,
              minWidth: '180px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()} // prevent outside clicks closing if you add that logic
          >
            <div style={{ marginBottom: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {Object.entries(tempSettings).map(([key, val]) => (
                <div key={key} style={{ marginBottom: '0.5rem' }}>
                  <label
                    htmlFor={`setting-${key}`}
                    style={{ fontSize: '0.85rem', display: 'block', marginBottom: '2px' }}
                  >
                    {key}
                  </label>
                  <input
                    id={`setting-${key}`}
                    type="text"
                    value={val}
                    onChange={(e) => this.handleSettingChange(key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '3px 6px',
                      borderRadius: '3px',
                      border: '1px solid #aaa',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={this.applySettings}
                style={{
                  marginRight: '0.5rem',
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                Apply
              </button>
              <button
                onClick={this.handleDelete}
                style={{ color: 'red', padding: '4px 10px', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Content of the figure */}
        <div style={{ flexGrow: 1, overflow: 'hidden', height: 'calc(100% - 2.5rem)' }}>
          {children}
        </div>
      </div>
    );
  }
}
