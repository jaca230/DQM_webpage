import React from 'react';

class LayoutManagementModal extends React.Component {
  fileInputRef = React.createRef();
  tabFileInputRef = React.createRef();

  onExportLayoutClick = () => {
    this.props.onManage('exportLayout');
  };

  onImportLayoutClick = () => {
    this.fileInputRef.current?.click();
  };

  onClearLayoutClick = () => {
    if (window.confirm('Clear all tabs?\n\nThis will remove all tabs and figures from the dashboard.')) {
      this.props.onManage('clearLayout');
    }
  };

  onResetLayoutClick = () => {
    if (window.confirm('Reset to default layout?\n\nThis will replace the current layout with the default layout.')) {
      this.props.onManage('resetLayout');
    }
  };

  onExportTabClick = () => {
    this.props.onManage('exportTab');
  };

  onImportTabClick = () => {
    this.tabFileInputRef.current?.click();
  };

  onLayoutFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      this.props.onManage('importLayout', { jsonString: evt.target.result });
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  onTabFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      this.props.onManage('importTab', { jsonString: evt.target.result });
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  onClose = () => {
    this.props.onClose();
  };

  render() {
    const { visible, tabs, activeTabId } = this.props;
    if (!visible) return null;

    const activeTab = tabs.find(tab => tab.id === activeTabId);
    const totalFigures = tabs.reduce((sum, tab) => sum + (tab.figures?.length || 0), 0);

    return (
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle}>
          <h2>Manage Layout</h2>

          {/* Tab Information */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '16px' }}>Tab Information</h3>

            <table style={tabTableStyle}>
              <thead>
                <tr>
                  <th style={tabThStyle}>Tab Name</th>
                  <th style={tabThStyle}>Figures</th>
                </tr>
              </thead>
              <tbody>
                {tabs.map((tab) => (
                  <tr
                    key={tab.id}
                    style={{
                      backgroundColor: tab.id === activeTabId ? '#e3f2fd' : 'transparent',
                    }}
                  >
                    <td style={tabTdStyle}>
                      {tab.name}
                      {tab.id === activeTabId && (
                        <span style={activeBadgeStyle}>Active</span>
                      )}
                    </td>
                    <td style={{ ...tabTdStyle, textAlign: 'left' }}>
                      {tab.figures?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={tabSummaryStyle}>
              <strong>Total:</strong> {tabs.length} tab{tabs.length !== 1 ? 's' : ''}, {totalFigures} figure{totalFigures !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Layout Actions */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '16px' }}>Layout Actions</h3>
            <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr' }}>
              <button onClick={this.onExportLayoutClick} style={actionButtonStyle}>Export Layout</button>
              <button onClick={this.onImportLayoutClick} style={actionButtonStyle}>Import Layout</button>
              <button onClick={this.onResetLayoutClick} style={{ ...actionButtonStyle, ...resetButtonStyle }}>Reset to Default</button>
              <button onClick={this.onClearLayoutClick} style={{ ...actionButtonStyle, ...dangerButtonStyle }}>Clear All Tabs</button>
            </div>
          </div>

          {/* Tab Actions */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '16px' }}>
              Current Tab Actions
              {activeTab && (
                <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666', marginLeft: '8px' }}>
                  ({activeTab.name})
                </span>
              )}
            </h3>
            <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr' }}>
              <button
                onClick={this.onExportTabClick}
                style={actionButtonStyle}
                disabled={!activeTab}
              >
                Export Current Tab
              </button>
              <button onClick={this.onImportTabClick} style={actionButtonStyle}>Import Tab</button>
            </div>
          </div>

          {/* Close Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={this.onClose} style={primaryButtonStyle}>Close</button>
          </div>

          {/* Hidden file inputs */}
          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            ref={this.fileInputRef}
            onChange={this.onLayoutFileChange}
          />
          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            ref={this.tabFileInputRef}
            onChange={this.onTabFileChange}
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

const tabTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: '#f8f9fa',
  border: '1px solid #ddd',
  borderRadius: '4px',
};

const tabThStyle = {
  padding: '12px',
  backgroundColor: '#e9ecef',
  borderBottom: '1px solid #ddd',
  fontSize: '14px',
  textAlign: 'left',
};

const tabTdStyle = {
  padding: '12px',
  borderBottom: '1px solid #eee',
  fontSize: '14px',
};

const tabSummaryStyle = {
  marginTop: '8px',
  fontSize: '14px',
  color: '#666',
  padding: '8px 12px',
  backgroundColor: '#f0f0f0',
  borderRadius: '4px',
};

const activeBadgeStyle = {
  marginLeft: '8px',
  padding: '2px 6px',
  backgroundColor: '#007bff',
  color: 'white',
  fontSize: '10px',
  borderRadius: '10px',
  fontWeight: 'normal',
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

export default LayoutManagementModal;
