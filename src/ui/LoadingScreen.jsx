// src/ui/LoadingScreen.jsx
import React from 'react';

export default class LoadingScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { remainingMs: props.remainingMs || 0 };
  }

  componentDidMount() {
    if (this.props.remainingMs && this.props.remainingMs > 0) {
      this.timer = setInterval(() => {
        const newRemaining = Math.max(this.state.remainingMs - 250, 0);
        this.setState({ remainingMs: newRemaining });
        if (newRemaining <= 0) {
          clearInterval(this.timer);
          // Call onTimeout callback when countdown reaches zero
          if (this.props.onTimeout) {
            this.props.onTimeout();
          }
        }
      }, 250);
    }
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }

  componentDidUpdate(prevProps) {
  if (this.props.remainingMs !== prevProps.remainingMs) {
    this.setState({ remainingMs: this.props.remainingMs });
  }
}

  render() {
    const secondsRemaining = Math.ceil(this.state.remainingMs / 1000);
    const { message = 'Loading, please wait...', overlay = false } = this.props;

    const containerStyle = overlay ? {
      // Overlay style for modal usage
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '8px',
      zIndex: 10
    } : {
      // Full screen style for standalone usage
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f7fa'
    };

    return (
      <div style={{
        ...containerStyle,
        color: '#333',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        fontSize: 18,
        userSelect: 'none',
      }}>
        <div style={{
          border: '6px solid #e0e0e0',
          borderTop: '6px solid #007bff',
          borderRadius: '50%',
          width: 48,
          height: 48,
          animation: 'spin 1s linear infinite',
          marginBottom: 16,
        }} />
        <div>{message}</div>
        {secondsRemaining > 0 && (
          <div>Timeout in {secondsRemaining} second{secondsRemaining !== 1 ? 's' : ''}...</div>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
}