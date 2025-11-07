import React from 'react';
import Table from '../tables/Table';
import SettingTypes from '../../enums/SettingTypes';

const RUN_STATES = ['Stable', 'Tuning', 'Calibrating', 'Investigate'];
const SYSTEMS = [
  'Cryogenics',
  'RF Cavities',
  'Vacuum Loop',
  'Trigger Farm',
  'DAQ Buffer',
  'Muon Veto',
  'Calorimeter Bias',
  'Magnet Power',
];

export default class RunStatusTable extends Table {
  static displayName = 'Run • Subsystem Status';
  static name = 'RunStatusTable';

  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      rows: this.buildRows(),
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
    this.setState({ rows: this.buildRows() });
  }

  buildRows() {
    const rowCount = Math.min(
      Math.max(3, this.settings.maxRows || 6),
      SYSTEMS.length
    );
    const shuffled = [...SYSTEMS].sort(() => Math.random() - 0.5);

    return shuffled.slice(0, rowCount).map((system) => {
      const load = 40 + Math.random() * 60;
      const drift = (Math.random() - 0.5) * 4;
      const stateIndex = load > 80 ? 0 : load > 70 ? 1 : load > 60 ? 2 : 3;
      const status = RUN_STATES[Math.min(RUN_STATES.length - 1, stateIndex)];

      return {
        system,
        status,
        load: load.toFixed(1),
        drift: drift.toFixed(1),
      };
    });
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
            fontSize: '0.9rem',
          }}
        >
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.35rem' }}>Subsystem</th>
              <th style={{ padding: '0.35rem' }}>Status</th>
              <th style={{ padding: '0.35rem' }}>Load (%)</th>
              <th style={{ padding: '0.35rem' }}>Drift (±%)</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((row) => (
              <tr key={row.system} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.35rem', fontWeight: 600 }}>{row.system}</td>
                <td style={{ padding: '0.35rem' }}>{this.renderChip(row.status)}</td>
                <td style={{ padding: '0.35rem' }}>{row.load}</td>
                <td
                  style={{
                    padding: '0.35rem',
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
