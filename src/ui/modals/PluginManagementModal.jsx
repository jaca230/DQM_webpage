import React from 'react';

class PluginManagementModal extends React.Component {
  fileInputRef = React.createRef();

  onRemoveClick = (pluginId) => {
    const plugin = this.props.plugins.find(p => p.id === pluginId);
    const pluginName = plugin ? plugin.name : 'Unknown Plugin';
    
    if (window.confirm(`Remove plugin "${pluginName}"?\n\nThis will remove it from the dashboard but figures from this plugin will remain until you refresh the page.`)) {
      this.props.onManage('remove', { pluginId });
    }
  };

  onLoadClick = (pluginId) => {
    this.props.onManage('load', { pluginId });
  };

  onExportClick = () => {
    this.props.onManage('export');
  };

  onImportClick = () => {
    this.fileInputRef.current?.click();
  };

  onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      this.props.onManage('import', { jsonString: evt.target.result });
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  onClearClick = () => {
    if (window.confirm('Clear all plugins?\n\nThis will remove all plugins from the dashboard but figures from these plugins will remain until you refresh the page.')) {
      this.props.onManage('clear');
    }
  };

  onResetClick = () => {
    if (window.confirm('Reset plugins to default?\n\nThis will replace all current plugins with the default plugin set.')) {
      this.props.onManage('reset');
    }
  };

  onClose = () => {
    this.props.onClose();
  };

  render() {
    const { visible, plugins } = this.props;
    if (!visible) return null;

    return (
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle}>
          <h2>Manage Plugins</h2>
          
          {/* Plugin List */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '16px' }}>
              Installed Plugins ({plugins.length})
            </h3>
            
            {plugins.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                color: '#666'
              }}>
                No plugins installed
              </div>
            ) : (
              <div style={{ 
                maxHeight: '240px', 
                overflowY: 'auto', 
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}>
                {plugins.map((plugin) => (
                  <div key={plugin.id} style={pluginItemStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {plugin.name}
                        {plugin.loaded && (
                          <span style={loadedBadgeStyle}>Loaded</span>
                        )}
                        {plugin.loadOnStartup && (
                          <span style={autoLoadBadgeStyle}>Auto-load</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
                        {plugin.url}
                      </div>
                      {plugin.description && (
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                          {plugin.description}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                        Method: {plugin.loadMethod || 'ES'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {!plugin.loaded && (
                        <button
                          onClick={() => this.onLoadClick(plugin.id)}
                          style={{
                            padding: '4px 10px',
                            background: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 13,
                            marginBottom: 4,
                          }}
                        >
                          Load
                        </button>
                      )}
                      <button 
                        onClick={() => this.onRemoveClick(plugin.id)} 
                        style={removeButtonStyle}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Management Actions */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '16px' }}>Plugin Actions</h3>
            <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr' }}>
              <button onClick={this.onExportClick} style={actionButtonStyle}>
                Export Plugins
              </button>
              <button onClick={this.onImportClick} style={actionButtonStyle}>
                Import Plugins
              </button>
              <button onClick={this.onResetClick} style={{ ...actionButtonStyle, ...resetButtonStyle }}>
                Reset to Default
              </button>
              <button onClick={this.onClearClick} style={{ ...actionButtonStyle, ...dangerButtonStyle }}>
                Clear All
              </button>
            </div>
          </div>

          {/* Close Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={this.onClose} style={primaryButtonStyle}>
              Close
            </button>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            ref={this.fileInputRef}
            onChange={this.onFileChange}
          />
        </div>
      </div>
    );
  }
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: '#fff',
  padding: '1.5rem',
  borderRadius: '8px',
  width: '600px',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
};

const pluginItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  padding: '12px',
  borderBottom: '1px solid #eee',
  gap: '12px',
};

const loadedBadgeStyle = {
  marginLeft: '8px',
  padding: '2px 6px',
  backgroundColor: '#28a745',
  color: 'white',
  fontSize: '10px',
  borderRadius: '10px',
  fontWeight: 'normal',
};

const autoLoadBadgeStyle = {
  marginLeft: '4px',
  padding: '2px 6px',
  backgroundColor: '#007bff',
  color: 'white',
  fontSize: '10px',
  borderRadius: '10px',
  fontWeight: 'normal',
};

const removeButtonStyle = {
  padding: '4px 8px',
  border: '1px solid #dc3545',
  borderRadius: '4px',
  backgroundColor: '#fff',
  color: '#dc3545',
  cursor: 'pointer',
  fontSize: '12px',
  transition: 'all 0.2s',
  flexShrink: 0,
};

const actionButtonStyle = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background-color 0.2s',
};

const resetButtonStyle = {
  backgroundColor: '#e8f0fe',
  borderColor: '#007bff',
  color: '#007bff',
};

const dangerButtonStyle = {
  backgroundColor: '#ffebee',
  borderColor: '#dc3545',
  color: '#dc3545',
};

const primaryButtonStyle = {
  padding: '8px 16px',
  border: '1px solid #007bff',
  borderRadius: '4px',
  backgroundColor: '#007bff',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background-color 0.2s',
};

export default PluginManagementModal;