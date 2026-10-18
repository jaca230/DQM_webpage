import React from 'react';
import Modal from './Modal';

const MIN_ZOOM_PERCENT = 20;
const MAX_ZOOM_PERCENT = 500;

export default class ApplicationSettingsModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.stateFromProps(props);
  }

  componentDidUpdate(previousProps) {
    if (!previousProps.visible && this.props.visible) {
      this.setState(this.stateFromProps(this.props));
    }
  }

  stateFromProps(props) {
    return {
      fetchMode: props.syncMode ? 'sync' : 'async',
      zoomPercent: Math.round((props.zoom || 1) * 100),
    };
  }

  handleApply = () => {
    const zoomPercent = Math.min(
      MAX_ZOOM_PERCENT,
      Math.max(MIN_ZOOM_PERCENT, Number(this.state.zoomPercent) || 100)
    );
    this.props.onApply?.({
      syncMode: this.state.fetchMode === 'sync',
      zoom: zoomPercent / 100,
    });
  };

  render() {
    const { visible, onClose, defaultZoom = 1 } = this.props;
    const { fetchMode, zoomPercent } = this.state;
    const footer = (
      <>
        <button className="button button-secondary" type="button" onClick={onClose}>Cancel</button>
        <button className="button button-primary" type="button" onClick={this.handleApply}>Apply</button>
      </>
    );

    return (
      <Modal visible={visible} title="Settings" className="settings-modal" onClose={onClose} footer={footer}>
        <div className="settings-section settings-section-compact">
          <h3>Data fetching</h3>
          <label className="radio-card">
            <input
              type="radio"
              name="fetch-mode"
              value="sync"
              checked={fetchMode === 'sync'}
              onChange={(event) => this.setState({ fetchMode: event.target.value })}
            />
            <span>
              <strong>Synchronized</strong>
              <small>Share one request per URL at the fastest requested interval.</small>
            </span>
          </label>
          <label className="radio-card">
            <input
              type="radio"
              name="fetch-mode"
              value="async"
              checked={fetchMode === 'async'}
              onChange={(event) => this.setState({ fetchMode: event.target.value })}
            />
            <span>
              <strong>Independent</strong>
              <small>Give every figure its own request schedule. This can generate more traffic.</small>
            </span>
          </label>
        </div>

        <div className="settings-section settings-section-compact">
          <h3>Canvas</h3>
          <label className="form-field" htmlFor="dashboard-zoom">
            <span>Zoom</span>
            <div className="zoom-control">
              <input
                id="dashboard-zoom"
                type="range"
                min={MIN_ZOOM_PERCENT}
                max={MAX_ZOOM_PERCENT}
                value={zoomPercent}
                onChange={(event) => this.setState({ zoomPercent: event.target.value })}
              />
              <input
                type="number"
                min={MIN_ZOOM_PERCENT}
                max={MAX_ZOOM_PERCENT}
                value={zoomPercent}
                onChange={(event) => this.setState({ zoomPercent: event.target.value })}
                aria-label="Canvas zoom percent"
              />
              <span>%</span>
            </div>
          </label>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => this.setState({ zoomPercent: Math.round(defaultZoom * 100) })}
          >
            Reset tab zoom
          </button>
        </div>
      </Modal>
    );
  }
}
