import React from 'react';
import BaseFigure from '../BaseFigure';
import SettingTypes from '../../enums/SettingTypes';

export default class DetectorAnimation extends BaseFigure {
  static displayName = 'Detector • Beamline Animation';
  static name = 'DetectorAnimation';

  constructor(props) {
    super(props);
    this.state = {
      pulse: 0,
    };
  }

  static get settingSchema() {
    return {
      accentColor: {
        type: SettingTypes.COLOR,
        default: 'rgba(14,165,233,1)',
        label: 'Accent Color',
      },
      pulseSpeed: {
        type: SettingTypes.NUMBER,
        default: 600,
        label: 'Pulse Speed (ms)',
      },
      showGrid: {
        type: SettingTypes.BOOLEAN,
        default: true,
        label: 'Show Grid Overlay',
      },
    };
  }

  componentDidMount() {
    this.startPulse();
  }

  componentDidUpdate(prevProps) {
    super.componentDidUpdate(prevProps);
    if (prevProps.settings?.pulseSpeed !== this.props.settings?.pulseSpeed) {
      this.startPulse();
    }
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  startPulse() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    const speed = Math.max(120, this.settings.pulseSpeed || 600);
    this.timer = setInterval(() => {
      this.setState(({ pulse }) => ({ pulse: (pulse + 1) % 360 }));
    }, speed);
  }

  renderDetectorLayers() {
    const { accentColor, showGrid } = this.settings;
    const pulse = this.state.pulse;

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '16px',
          background: 'radial-gradient(circle at 30% 30%, rgba(15,118,110,0.3), rgba(15,23,42,0.95))',
          overflow: 'hidden',
          border: '1px solid rgba(59,130,246,0.2)',
        }}
      >
        {showGrid && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        )}
        {[1.1, 0.85, 0.6, 0.4].map((scale, idx) => (
          <div
            key={scale}
            style={{
              position: 'absolute',
              top: `${(1 - scale) * 50}%`,
              left: `${(1 - scale) * 50}%`,
              width: `${scale * 100}%`,
              height: `${scale * 100}%`,
              borderRadius: '50%',
              border: `1px solid rgba(148,163,184,${0.3 + idx * 0.1})`,
              boxShadow:
                idx === 1
                  ? `0 0 40px rgba(59,130,246,0.25), inset 0 0 60px rgba(15,118,110,0.25)`
                  : 'none',
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            inset: '32% 20% 32% 20%',
            background:
              'linear-gradient(90deg, rgba(59,130,246,0.05) 0%, rgba(14,165,233,0.4) 50%, rgba(59,130,246,0.1) 100%)',
            borderRadius: '999px',
            boxShadow: '0 0 30px rgba(59,130,246,0.45)',
            transform: `translateX(${Math.sin(pulse * Math.PI / 180) * 6}px)`,
            transition: 'transform 0.2s linear',
          }}
        />
        {[...Array(5)].map((_, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              top: `${20 + idx * 12}%`,
              left: '50%',
              width: '2px',
              height: '10%',
              background: 'rgba(226,232,240,0.4)',
              transform: `translateX(-50%) rotate(${idx * 7 - 14}deg)`,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            inset: '40% 30% 40% 30%',
            borderRadius: '999px',
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 65%)`,
            opacity: 0.7,
            animation: 'detector-pulse 2s ease-in-out infinite',
          }}
        />

        <style>
          {`
            @keyframes detector-pulse {
              0% { transform: scale(0.8); opacity: 0.5; }
              50% { transform: scale(1); opacity: 0.9; }
              100% { transform: scale(0.8); opacity: 0.5; }
            }
          `}
        </style>
      </div>
    );
  }

  render() {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        {this.renderDetectorLayers()}
      </div>
    );
  }
}
