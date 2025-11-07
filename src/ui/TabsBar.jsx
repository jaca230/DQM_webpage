import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X } from 'lucide-react';

export default function TabsBar({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onDeleteTab,
  onRenameTab,
  onReorderTabs,
}) {
  const [editTabId, setEditTabId] = useState(null);
  const [editName, setEditName] = useState('');
  const [dragState, setDragState] = useState(null);

  const containerRef = useRef(null);
  const tabRefs = useRef({});

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

  // Calculate which tab position the dragged tab should be inserted before
  const getTargetIndex = useCallback((draggedId, currentX) => {
    const draggedIndex = tabs.findIndex(t => t.id === draggedId);
    if (draggedIndex === -1) return tabs.length;

    let targetIndex = tabs.length;

    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].id === draggedId) continue;
      const ref = tabRefs.current[tabs[i].id];
      if (!ref) continue;

      const rect = ref.getBoundingClientRect();
      // Get the original center position (before any transforms)
      const center = rect.left + rect.width / 2;

      if (currentX < center) {
        targetIndex = i;
        break;
      }
    }

    return targetIndex;
  }, [tabs]);

  // Handle pointer move during drag
  const handlePointerMove = useCallback((event) => {
    setDragState(prev => {
      if (!prev) return prev;

      const deltaX = event.clientX - prev.startX;
      const currentX = prev.originalX + deltaX;
      const targetIndex = getTargetIndex(prev.tabId, currentX);

      return {
        ...prev,
        currentX,
        deltaX,
        targetIndex,
        hasMoved: prev.hasMoved || Math.abs(deltaX) > 3,
      };
    });
  }, [getTargetIndex]);

  // Handle pointer release
  const handlePointerUp = useCallback(() => {
    setDragState(prev => {
      if (!prev) return null;

      // If the user barely moved, treat it as a click
      if (!prev.hasMoved) {
        onSelectTab?.(prev.tabId);
      } else if (typeof onReorderTabs === 'function') {
        // Perform the actual reorder
        const originalIndex = tabs.findIndex(t => t.id === prev.tabId);
        const targetIndex = prev.targetIndex;

        if (targetIndex !== originalIndex) {
          // Get the ID of the tab we should insert before (or null for end)
          const insertBeforeId = targetIndex < tabs.length ? tabs[targetIndex].id : null;
          onReorderTabs(prev.tabId, insertBeforeId);
        }
      }

      return null;
    });

    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.body.style.userSelect = '';
  }, [tabs, handlePointerMove, onSelectTab, onReorderTabs]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.body.style.userSelect = '';
    };
  }, [handlePointerMove, handlePointerUp]);

  // Start dragging a tab
  const startDrag = (tabId, event) => {
    // Ignore non-left clicks
    if (event.button !== 0) return;
    // Don't drag if clicking on buttons
    if (event.target.closest('button')) return;
    // Don't drag if editing
    if (event.target.tagName === 'INPUT') return;
    if (editTabId && editTabId === tabId) return;
    // Ignore double clicks
    if (event.detail > 1) return;

    const tabEl = tabRefs.current[tabId];
    if (!tabEl) return;

    const rect = tabEl.getBoundingClientRect();
    const originalIndex = tabs.findIndex(t => t.id === tabId);

    setDragState({
      tabId,
      startX: event.clientX,
      originalX: rect.left + rect.width / 2,
      currentX: rect.left + rect.width / 2,
      deltaX: 0,
      targetIndex: originalIndex,
      hasMoved: false,
    });

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}
    >
      {tabs.map((tab, index) => {
        const isDragging = dragState?.tabId === tab.id;
        const originalIndex = dragState ? tabs.findIndex(t => t.id === dragState.tabId) : -1;
        const targetIndex = dragState?.targetIndex ?? -1;

        // Calculate if this tab should shift to make room for the dragged tab
        let translateX = 0;
        if (dragState && !isDragging) {
          // If dragging is happening and this isn't the dragged tab
          if (originalIndex < targetIndex && index >= originalIndex && index < targetIndex) {
            // Shifting left (tab moving right)
            const draggedTabWidth = tabRefs.current[dragState.tabId]?.getBoundingClientRect().width || 0;
            translateX = -(draggedTabWidth + 5); // 5px for margin
          } else if (originalIndex > targetIndex && index >= targetIndex && index < originalIndex) {
            // Shifting right (tab moving left)
            const draggedTabWidth = tabRefs.current[dragState.tabId]?.getBoundingClientRect().width || 0;
            translateX = draggedTabWidth + 5;
          }
        }

        return (
          <div
            key={tab.id}
            ref={(el) => {
              if (el) {
                tabRefs.current[tab.id] = el;
              } else {
                delete tabRefs.current[tab.id];
              }
            }}
            onPointerDown={(e) => startDrag(tab.id, e)}
            style={{
              padding: '0.3rem 0.6rem',
              marginRight: '0.3rem',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: tab.id === activeTabId ? '#ddd' : '#eee',
              display: 'flex',
              alignItems: 'center',
              minWidth: '80px',
              opacity: isDragging ? 0.7 : 1,
              position: isDragging ? 'relative' : 'static',
              zIndex: isDragging ? 1000 : 1,
              transform: isDragging
                ? `translateX(${dragState.deltaX}px)`
                : `translateX(${translateX}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
            }}
            onClick={() => {
              if (!dragState) {
                onSelectTab(tab.id);
              }
            }}
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
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
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
        );
      })}

      <div style={{ display: 'flex', alignItems: 'center' }}>
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
    </div>
  );
}
