import React from 'react';

export default function SettingsMenu({ settings, onChange, onApply, onDelete }) {
  return (
    <div
      className="no-drag"
      style={{
        position: 'absolute',
        top: '2.5rem',
        right: '0.5rem',
        background: '#eee',
        padding: '0.5rem',
        borderRadius: '4px',
        zIndex: 10,
        minWidth: '180px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ marginBottom: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
        {Object.entries(settings).map(([key, val]) => (
          <div key={key} style={{ marginBottom: '0.5rem' }}>
            <label
              htmlFor={`setting-${key}`}
              style={{ fontSize: '0.85rem', display: 'block', marginBottom: '2px' }}
            >
              {key}
            </label>
            <input
              id={`setting-${key}`}
              type="text"
              value={val}
              onChange={(e) => onChange(key, e.target.value)}
              style={{
                width: '100%',
                maxWidth: '140px',
                minWidth: '80px',
                padding: '3px 6px',
                borderRadius: '3px',
                border: '1px solid #aaa',
                fontSize: '0.9rem',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onApply}
          style={{
            marginRight: '0.5rem',
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          Apply
        </button>
        <button
          onClick={onDelete}
          style={{ color: 'red', padding: '4px 10px', cursor: 'pointer' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
