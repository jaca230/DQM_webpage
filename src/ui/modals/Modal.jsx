import React from 'react';
import { X } from 'lucide-react';

export default class Modal extends React.Component {
  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event) => {
    if (event.key === 'Escape' && this.props.visible) {
      this.props.onClose?.();
    }
  };

  render() {
    const { visible, title, children, footer, onClose, className = '' } = this.props;
    if (!visible) return null;

    return (
      <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
        <section
          className={`modal-panel ${className}`.trim()}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className="modal-header">
            <h2>{title}</h2>
            <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog">
              <X size={20} />
            </button>
          </header>
          <div className="modal-body">{children}</div>
          {footer && <footer className="modal-footer">{footer}</footer>}
        </section>
      </div>
    );
  }
}
