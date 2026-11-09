import React from 'react';
import Modal from './Modal';

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
    };
  }

  handleApply = () => {
    this.props.onApply?.({
      syncMode: this.state.fetchMode === 'sync',
    });
  };

  render() {
    const { visible, onClose } = this.props;
    const { fetchMode } = this.state;
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

      </Modal>
    );
  }
}
