import React from 'react';

class PluginRegistrationModal extends React.Component {
  state = {
    pluginUrl: '',
    pluginName: '',
    pluginDescription: '',
    loadOnStartup: true,
    loadMethod: 'ES',
    error: '',
  };

  resetForm = () => {
    this.setState({
      pluginUrl: '',
      pluginName: '',
      pluginDescription: '',
      loadOnStartup: true,
      loadMethod: 'ES',
      error: '',
    });
  };

  onChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    this.setState({ [field]: value, error: '' });
  };

  onSubmit = () => {
    const { pluginUrl, pluginName, pluginDescription, loadOnStartup, loadMethod } = this.state;
    
    if (!pluginUrl.trim()) {
      this.setState({ error: 'Plugin URL is required.' });
      return;
    }

    if (!pluginName.trim()) {
      this.setState({ error: 'Plugin name is required.' });
      return;
    }

    // Validate URL format
    try {
      new URL(pluginUrl.trim());
    } catch {
      this.setState({ error: 'Please enter a valid URL.' });
      return;
    }

    const pluginInfo = {
      id: `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: pluginName.trim(),
      url: pluginUrl.trim(),
      description: pluginDescription.trim(),
      loadOnStartup,
      loadMethod,
      loaded: false,
      metadata: {},
    };

    this.props.onRegister(pluginInfo);
    this.resetForm();
  };

  onClose = () => {
    this.resetForm();
    this.props.onClose();
  };

  render() {
    const { visible } = this.props;
    const { pluginUrl, pluginName, pluginDescription, loadOnStartup, loadMethod, error } = this.state;
    
    if (!visible) return null;

    return (
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle}>
          <h2>Add New Plugin</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Plugin URL *</label>
            <input
              type="text"
              placeholder="https://example.com/my-plugin.js"
              value={pluginUrl}
              onChange={this.onChange('pluginUrl')}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Plugin Name *</label>
            <input
              type="text"
              placeholder="My Awesome Plugin"
              value={pluginName}
              onChange={this.onChange('pluginName')}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              placeholder="Optional description of what this plugin does..."
              value={pluginDescription}
              onChange={this.onChange('pluginDescription')}
              style={{ ...inputStyle, height: '60px', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Load Method</label>
            <select
              value={loadMethod}
              onChange={this.onChange('loadMethod')}
              style={inputStyle}
            >
              <option value="ES">ES Module</option>
              <option value="script">Script Tag</option>
              <option value="eval">Eval</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={loadOnStartup}
                onChange={this.onChange('loadOnStartup')}
                style={{ marginRight: '8px' }}
              />
              Load on startup
            </label>
          </div>

          {error && (
            <div style={{ 
              color: '#d32f2f', 
              backgroundColor: '#ffebee', 
              padding: '8px 12px', 
              borderRadius: '4px', 
              marginBottom: '1rem',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button onClick={this.onClose} style={buttonStyle}>
              Cancel
            </button>
            <button onClick={this.onSubmit} style={{ ...buttonStyle, ...primaryButtonStyle }}>
              Add Plugin
            </button>
          </div>
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
  width: '480px',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
};

const labelStyle = {
  display: 'block',
  marginBottom: '4px',
  fontWeight: '500',
  fontSize: '14px',
  color: '#333',
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const buttonStyle = {
  padding: '8px 16px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background-color 0.2s',
};

const primaryButtonStyle = {
  backgroundColor: '#007bff',
  borderColor: '#007bff',
  color: '#fff',
};

export default PluginRegistrationModal;