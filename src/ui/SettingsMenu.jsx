import React, { useState } from 'react';
import { Sliders } from 'lucide-react';

export default function SettingsMenu({ settings = { brightness: '100', contrast: '50', saturation: '75' }, schema = {}, onChange = () => {}, onApply = () => {}, onDelete = () => {} }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filteredSettings = Object.entries(settings).filter(([key]) => {
    const meta = schema[key] || {};
    return meta.advanced ? showAdvanced : true;
  });

  return (
    <div
      className="no-drag"
      style={{
        position: 'absolute',
        top: '2.5rem',
        left: '0.5rem',
        background: 'rgba(255, 255, 255, 0.005)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '0.75rem',
        borderRadius: '16px',
        zIndex: 10,
        minWidth: '200px',
        minHeight: '200px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 2px 16px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        resize: 'both',
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        marginBottom: '0.75rem',
        paddingRight: '4px' // Account for scrollbar
      }}>
        {filteredSettings.map(([key, val]) => {
          const meta = schema[key] || {};
          const label = meta.label || key;
          return (
            <div key={key} style={{ marginBottom: '0.75rem' }}>
              <label
                htmlFor={`setting-${key}`}
                style={{ 
                  fontSize: '0.8rem', 
                  display: 'block', 
                  marginBottom: '4px',
                  color: 'rgba(0, 0, 0, 0.9)',
                  fontWeight: '600',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
                }}
              >
                {label}
              </label>
              <input
                id={`setting-${key}`}
                type="text"
                value={val}
                onChange={(e) => onChange(key, e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '3px solid rgba(0, 0, 0, 0.4)',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  color: 'rgba(0, 0, 0, 0.95)',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '3px solid rgba(0, 123, 255, 0.9)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.98)';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.95)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '3px solid rgba(0, 0, 0, 0.4)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.95)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)';
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: '6px'
      }}>
        <button
          onClick={onApply}
          style={{
            padding: '6px 12px',
            cursor: 'pointer',
            borderRadius: '8px',
            border: '1px solid rgba(0, 123, 255, 0.3)',
            background: 'rgba(0, 123, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.8rem',
            transition: 'all 0.2s ease',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 123, 255, 0.9)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0, 123, 255, 0.8)';
            e.target.style.transform = 'translateY(0)';
          }}
          type="button"
        >
          Apply
        </button>
        <button
          onClick={onDelete}
          style={{
            color: 'rgba(220, 53, 69, 0.9)',
            padding: '6px 12px',
            cursor: 'pointer',
            borderRadius: '8px',
            border: '1px solid rgba(220, 53, 69, 0.2)',
            background: 'rgba(220, 53, 69, 0.1)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            fontWeight: '500',
            fontSize: '0.8rem',
            transition: 'all 0.2s ease',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(220, 53, 69, 0.2)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(220, 53, 69, 0.1)';
            e.target.style.transform = 'translateY(0)';
          }}
          type="button"
        >
          Delete
        </button>
      </div>

      <button
        onClick={() => setShowAdvanced((v) => !v)}
        style={{
          marginTop: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: 'rgba(0, 123, 255, 0.9)',
          fontSize: '0.85rem',
          cursor: 'pointer',
          userSelect: 'none',
          padding: '8px 12px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.transform = 'translateY(0)';
        }}
        aria-pressed={showAdvanced}
        aria-label="Toggle advanced settings visibility"
        type="button"
      >
        <Sliders size={16} strokeWidth={2} />
        {showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
      </button>
    </div>
  );
}