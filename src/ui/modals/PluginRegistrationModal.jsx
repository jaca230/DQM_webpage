import React from 'react';
import LoadingScreen from '../LoadingScreen';  // adjust path as needed

class PluginRegistrationModal extends React.Component {
  state = {
    pluginUrl: '',
    pluginName: '',
    pluginDescription: '',
    loadOnStartup: true,
    loadMethod: 'ES',
    error: '',
    success: '',
    loading: false,         
    loadingTimeoutMs: 10000 
  };

  resetForm = () => {
    this.setState({
      pluginUrl: '',
      pluginName: '',
      pluginDescription: '',
      loadOnStartup: true,
      loadMethod: 'ES',
      error: '',
      success: '',
      loading: false,
    });
  };

  onChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    this.setState({ [field]: value, error: '', success: '' });
  };

  onLoadingTimeout = () => {
    this.setState({
      loading: false,
      error: 'Plugin loading timed out. Please try again.',
      success: ''
    });
  };

  onSubmit = async () => {
    const { pluginUrl, pluginName, pluginDescription, loadOnStartup, loadMethod } = this.state;

    if (!pluginUrl.trim()) {
      this.setState({ error: 'Plugin URL is required.' });
      return;
    }
    if (!pluginName.trim()) {
      this.setState({ error: 'Plugin name is required.' });
      return;
    }

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

    try {
      this.setState({ loading: true, error: '', success: '' });

      const result = await this.props.onRegister(pluginInfo);

      if (result?.success) {
        const figureList = result.newNames?.length
          ? result.newNames.join(', ')
          : 'No figures registered';

        this.setState({
          success: `Plugin loaded using ${result.method}. Figures registered: ${figureList}.`,
          error: '',
          loading: false,
        });
      } else {
        this.setState({
          error: `Plugin failed to load: ${result?.error || 'Unknown error'}`,
          success: '',
          loading: false,
        });
      }
    } catch (err) {
      this.setState({
        error: `Error loading plugin: ${err.message || err}`,
        success: '',
        loading: false,
      });
    }
  };

  onClose = () => {
    this.resetForm();
    this.props.onClose();
  };

  onAddAnother = () => {
    this.resetForm();
  };

  render() {
    const { visible } = this.props;
    if (!visible) return null;

    const {
      pluginUrl,
      pluginName,
      pluginDescription,
      loadOnStartup,
      loadMethod,
      error,
      success,
      loading,
      loadingTimeoutMs,
    } = this.state;

    return (
      <div style={modalOverlayStyle}>
        <div style={{ ...modalContentStyle, position: 'relative' }}>
          {/* Show loading overlay within the modal */}
          {loading && (
            <LoadingScreen
              remainingMs={loadingTimeoutMs}
              message="Loading plugin, please wait..."
              overlay={true}
              onTimeout={this.onLoadingTimeout}
            />
          )}
          
          <h2>Add New Plugin</h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Plugin URL *</label>
            <input
              type="text"
              placeholder="https://example.com/my-plugin.js"
              value={pluginUrl}
              onChange={this.onChange('pluginUrl')}
              style={inputStyle}
              disabled={!!success}
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
              disabled={!!success}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              placeholder="Optional description of what this plugin does..."
              value={pluginDescription}
              onChange={this.onChange('pluginDescription')}
              style={{ ...inputStyle, height: '60px', resize: 'vertical' }}
              disabled={!!success}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Load Method</label>
            <select
              value={loadMethod}
              onChange={this.onChange('loadMethod')}
              style={inputStyle}
              disabled={!!success}
            >
              <option value="ES">ES Module</option>
              <option value="script">Script Tag (BROKEN)</option>
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
                disabled={!!success}
              />
              Load on startup
            </label>
          </div>

          {error && <div style={errorBoxStyle}>{error}</div>}
          {success && <div style={successBoxStyle}>{success}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button onClick={this.onClose} style={buttonStyle}>
              Close
            </button>
            {success ? (
              <button onClick={this.onAddAnother} style={{ ...buttonStyle, ...primaryButtonStyle }}>
                Add Another Plugin
              </button>
            ) : (
              <button onClick={this.onSubmit} style={{ ...buttonStyle, ...primaryButtonStyle }}>
                Add Plugin
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
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

const errorBoxStyle = {
  color: '#d32f2f',
  backgroundColor: '#ffebee',
  padding: '8px 12px',
  borderRadius: '4px',
  marginBottom: '1rem',
  fontSize: '14px',
};

const successBoxStyle = {
  color: '#2e7d32',
  backgroundColor: '#e8f5e9',
  padding: '8px 12px',
  borderRadius: '4px',
  marginBottom: '1rem',
  fontSize: '14px',
};

export default PluginRegistrationModal;