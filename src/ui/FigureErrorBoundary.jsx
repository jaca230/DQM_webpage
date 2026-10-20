import React from 'react';

export default class FigureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, details) {
    console.error(`Figure ${this.props.figureId} failed to render`, error, details);
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" style={{ padding: 16, color: '#9f1239' }}>
          This figure could not be displayed.
          <button type="button" onClick={() => this.setState({ error: null })} style={{ marginLeft: 10 }}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
