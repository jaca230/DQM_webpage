import React from 'react';
import Table from './Table';
import SettingTypes from '../../enums/SettingTypes';

const SOURCE_NAMES = [
  'Ingestion API',
  'Warehouse Sync',
  'Customer Events',
  'Partner Feed',
  'Billing Export',
  'Telemetry Stream',
];

/**
 * Simple status table that refreshes itself on the client for the demo build.
 */
export default class DemoStatusTable extends Table {
  static displayName = 'Demo • Status Table';
  static name = 'DemoStatusTable';

  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      rows: this.generateRows(true),
    };
  }

  static get settingSchema() {
    const parent = super.settingSchema || {};
    return {
      ...parent,
      dataUrl: {
        ...(parent.dataUrl || {}),
        default: 'None',
        label: 'Data URL (unused in demo)',
        advanced: true,
      },
      updateFrequency: {
        ...(parent.updateFrequency || {}),
        type: SettingTypes.NUMBER,
        default: 2,
        label: 'Update Interval (s)',
        onChange: 'onUpdateFrequencyChange',
      },
      rowCount: {
        type: SettingTypes.INT,
        default: 4,
        label: 'Rows',
      },
      alertThreshold: {
        type: SettingTypes.NUMBER,
        default: 92,
        label: 'Alert Threshold',
      },
    };
  }

  getDataUrl() {
    return 'None';
  }

  onLocalTick() {
    this.setState({ rows: this.generateRows(false) });
  }

  generateRows(isInitial) {
    const { rowCount, alertThreshold } = this.settings;
    const count = Math.min(Math.max(rowCount || 4, 3), SOURCE_NAMES.length);
    const previous = !isInitial ? this.state?.rows || [] : [];

    return Array.from({ length: count }, (_, idx) => {
      const sourceName = SOURCE_NAMES[idx];
      const prevValue = previous[idx]?.value ?? (94 - idx * 2);
      const drift = (Math.random() - 0.5) * 3.5;
      const nextValue = Math.max(70, Math.min(100, prevValue + drift));
      const delta = nextValue - prevValue;
      const status = nextValue >= alertThreshold ? 'Healthy' : 'Investigate';

      return {
        name: sourceName,
        value: +nextValue.toFixed(1),
        delta: +delta.toFixed(1),
        status,
      };
    });
  }

  renderBadge(status) {
    const isHealthy = status === 'Healthy';
    return (
      <span
        style={{
          padding: '0.1rem 0.5rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: isHealthy ? '#166534' : '#991b1b',
          backgroundColor: isHealthy ? 'rgba(22, 101, 52, 0.12)' : 'rgba(153, 27, 27, 0.12)',
        }}
      >
        {status}
      </span>
    );
  }

  render() {
    const { loading, error, rows } = this.state;

    if (loading) {
      return <div style={{ padding: '1rem' }}>Preparing demo data...</div>;
    }

    if (error) {
      return <div style={{ padding: '1rem', color: 'red' }}>Error: {error}</div>;
    }

    return (
      <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
        <table
          className="no-drag"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem',
          }}
        >
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.4rem 0.25rem' }}>Source</th>
              <th style={{ padding: '0.4rem 0.25rem' }}>Quality</th>
              <th style={{ padding: '0.4rem 0.25rem' }}>Δ (pts)</th>
              <th style={{ padding: '0.4rem 0.25rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((row) => (
              <tr key={row.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.4rem 0.25rem', fontWeight: 500 }}>{row.name}</td>
                <td style={{ padding: '0.4rem 0.25rem' }}>{row.value}%</td>
                <td
                  style={{
                    padding: '0.4rem 0.25rem',
                    color: row.delta >= 0 ? '#166534' : '#b91c1c',
                    fontWeight: 600,
                  }}
                >
                  {row.delta >= 0 ? '+' : ''}
                  {row.delta}
                </td>
                <td style={{ padding: '0.4rem 0.25rem' }}>{this.renderBadge(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
