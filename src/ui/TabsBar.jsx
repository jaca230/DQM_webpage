import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

export default function TabsBar({ tabs, activeTabId, onSelectTab, onAddTab, onDeleteTab, onRenameTab }) {
  const [editTabId, setEditTabId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (editTabId) {
      const tab = tabs.find(t => t.id === editTabId);
      if (tab) setEditName(tab.name);
    }
  }, [editTabId, tabs]);

  const handleNameChange = (e) => setEditName(e.target.value);

  const finishEditing = () => {
    if (editName.trim()) {
      onRenameTab(editTabId, editName.trim());
    }
    setEditTabId(null);
    setEditName('');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
      {tabs.map(tab => (
        <div
          key={tab.id}
          style={{
            padding: '0.3rem 0.6rem',
            marginRight: '0.3rem',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: tab.id === activeTabId ? '#ddd' : '#eee',
            display: 'flex',
            alignItems: 'center',
            minWidth: '80px',
          }}
          onClick={() => onSelectTab(tab.id)}
        >
          {editTabId === tab.id ? (
            <input
              type="text"
              value={editName}
              onChange={handleNameChange}
              onBlur={finishEditing}
              onKeyDown={e => {
                if (e.key === 'Enter') finishEditing();
                if (e.key === 'Escape') setEditTabId(null);
              }}
              autoFocus
              style={{ flexGrow: 1, fontSize: '0.9rem' }}
            />
          ) : (
            <span
              onDoubleClick={e => {
                e.stopPropagation();
                setEditTabId(tab.id);
              }}
              style={{ flexGrow: 1, userSelect: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={tab.name}
            >
              {tab.name}
            </span>
          )}
            <button
            onClick={e => {
                e.stopPropagation();
                if (window.confirm(`Delete tab "${tab.name}"?`)) onDeleteTab(tab.id);
            }}
            style={{
                marginLeft: '0.3rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'red',
                cursor: 'pointer',
                padding: '4px',             // added padding for bigger clickable area
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',        // circular button shape
                transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label={`Delete tab ${tab.name}`}
            title={`Delete tab ${tab.name}`}
            >
            <X size={18} strokeWidth={3} />
            </button>
        </div>
      ))}

        <button
        onClick={onAddTab}
        style={{
            padding: '0.3rem 0.6rem',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: '#eee',   // same as inactive tabs
            color: '#333',             // dark text for contrast
            fontWeight: 'bold',
            userSelect: 'none',
            minWidth: '30px',
            textAlign: 'center',
            border: '1px solid #ccc',
            transition: 'background-color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ddd'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#eee'}
        aria-label="Add new tab"
        title="Add new tab"
        >
        <Plus size={16} strokeWidth={2} />
        </button>
    </div>
  );
}
