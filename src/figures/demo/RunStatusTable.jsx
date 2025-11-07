import React from 'react';
import Table from '../tables/Table';
import SettingTypes from '../../enums/SettingTypes';

const SYSTEMS = [
  'Subsystem A',
  'Subsystem B',
  'Subsystem C',
  'Subsystem D',
  'Subsystem E',
  'Subsystem F',
  'Subsystem G',
  'Subsystem H',
];

export default class RunStatusTable extends Table {
  static displayName = 'Subsystem Status Table';
  static name = 'RunStatusTable';

  constructor(props) {
    super(props);
    this.systemStats = SYSTEMS.map((system, idx) => ({
      system,
      load: 55 + idx * 3 + Math.random() * 10,
      drift: 0,
      status: 'Stable',
    }));
    this.state = {
      ...this.state,
      rows: this.snapshotRows(),
    };
  }

  static get settingSchema() {
    const base = super.settingSchema || {};
    return {
      ...base,
      dataUrl: {
        ...(base.dataUrl || {}),
        default: 'None',
        label: 'Data URL (unused)',
        advanced: true,
      },
      updateFrequency: {
        ...(base.updateFrequency || {}),
        default: 1.4,
        label: 'Refresh Interval (s)',
        onChange: 'onUpdateFrequencyChange',
      },
      maxRows: {
        type: SettingTypes.INT,
        default: 6,
        label: 'Visible Systems',
      },
    };
  }

  getDataUrl() {
    return 'None';
  }

  onLocalTick() {
    this.updateSystemStats();
    this.setState({ rows: this.snapshotRows() });
  }

  updateSystemStats() {
    this.systemStats = this.systemStats.map((stat) => {
      const drift = (Math.random() - 0.5) * 2.5;
      const load = Math.max(40, Math.min(110, stat.load + drift));

      let status = 'Investigate';
      if (load >= 90) status = 'Stable';
      else if (load >= 80) status = 'Tuning';
      else if (load >= 70) status = 'Calibrating';

      return {
        ...stat,
        load,
        drift,
        status,
      };
    });
  }

  snapshotRows() {
    const rowCount = Math.min(
      Math.max(3, this.settings.maxRows || 6),
      SYSTEMS.length
    );
    return this.systemStats.slice(0, rowCount).map((stat) => ({
      system: stat.system,
      status: stat.status,
      load: stat.load.toFixed(1),
      drift: stat.drift.toFixed(1),
    }));
  }

  renderChip(status) {
    const palette = {
      Stable: { bg: 'rgba(74,222,128,0.15)', color: '#15803d' },
      Tuning: { bg: 'rgba(129,140,248,0.2)', color: '#4338ca' },
      Calibrating: { bg: 'rgba(248,180,0,0.15)', color: '#92400e' },
      Investigate: { bg: 'rgba(248,113,113,0.2)', color: '#b91c1c' },
    };
    const style = palette[status] || palette.Stable;
    return (
      <span
        style={{
          padding: '0.1rem 0.5rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {status}
      </span>
    );
  }

  render() {
    const { rows, loading } = this.state;

    if (loading) {
      return <div style={{ padding: '1rem' }}>Loading run status…</div>;
    }

    return (
      <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '1rem',
          }}
        >
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.45rem' }}>Subsystem</th>
              <th style={{ padding: '0.45rem' }}>Status</th>
              <th style={{ padding: '0.45rem' }}>Load (%)</th>
              <th style={{ padding: '0.45rem' }}>Drift (±%)</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((row) => (
              <tr key={row.system} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.45rem', fontWeight: 600 }}>{row.system}</td>
                <td style={{ padding: '0.45rem' }}>{this.renderChip(row.status)}</td>
                <td style={{ padding: '0.45rem' }}>{row.load}</td>
                <td
                  style={{
                    padding: '0.45rem',
                    color: parseFloat(row.drift) >= 0 ? '#166534' : '#b91c1c',
                    fontWeight: 600,
                  }}
                >
                  {parseFloat(row.drift) >= 0 ? '+' : ''}
                  {row.drift}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
