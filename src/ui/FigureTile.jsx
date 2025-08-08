import React from 'react';
import { Stage, Layer, Group, Rect, Transformer } from 'react-konva';
import FigureTitle from './FigureTitle';
import { Move, Settings } from 'lucide-react';
import SettingsMenu from './SettingsMenu';

export default class FigureTile extends React.Component {
  shapeRef = React.createRef();
  transformerRef = React.createRef();
  dragHandleRef = React.createRef();

  state = {
    showMenu: false,
    tempSettings: null,
    isSelected: false,
    isDragging: false,
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.showMenu &&
      prevProps.settings !== this.props.settings
    ) {
      this.setState({ tempSettings: { ...this.props.settings } });
    }

    if (this.state.isSelected && !prevState.isSelected) {
      this.transformerRef.current.nodes([this.shapeRef.current]);
      this.transformerRef.current.getLayer().batchDraw();
    }
    if (!this.state.isSelected && prevState.isSelected) {
      this.transformerRef.current.nodes([]);
      this.transformerRef.current.getLayer().batchDraw();
    }
  }

  toggleMenu = (e) => {
    e.stopPropagation();
    this.setState((prev) => ({
      showMenu: !prev.showMenu,
      tempSettings: !prev.showMenu ? { ...this.props.settings } : null,
    }));
  };

  handleDelete = (e) => {
    e.stopPropagation();
    this.props.onDelete();
  };

  handleSettingChange = (key, value) => {
    this.setState((prev) => ({
      tempSettings: { ...prev.tempSettings, [key]: value },
    }));
  };

  applySettings = () => {
    if (this.state.tempSettings) {
      this.props.onSettingsChange(this.state.tempSettings);
    }
    this.setState({ showMenu: false, tempSettings: null });
  };

  onTitleChange = (newTitle) => {
    this.props.onTitleChange(newTitle);
  };

  onDragStart = (e) => {
    this.setState({ isDragging: true });
    this.shapeRef.current.moveToTop();
  };

  onDragEnd = (e) => {
    this.setState({ isDragging: false });
    const node = e.target;
    this.props.onDragStop({ x: node.x(), y: node.y() });
  };

  onTransformEnd = () => {
    const node = this.shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(20, node.width() * scaleX);
    const newHeight = Math.max(20, node.height() * scaleY);

    this.props.onResizeStop(
      { style: { width: `${newWidth}px`, height: `${newHeight}px` } },
      { x: node.x(), y: node.y() }
    );

    this.props.onRotationChange(node.rotation());
  };

  onSelect = (e) => {
    e.cancelBubble = true;
    this.setState({ isSelected: true });
  };

  onDeselect = () => {
    if (this.state.isSelected) this.setState({ isSelected: false });
  };

  handleDragHandleMouseDown = (e) => {
    // Start dragging the Konva group when the drag handle is clicked
    e.stopPropagation();
    this.shapeRef.current.startDrag();
  };

  render() {
    const {
      title,
      children,
      schema = {},
      x,
      y,
      width,
      height,
      zIndex,
      rotation = 0,
    } = this.props;
    const { showMenu, tempSettings, isSelected, isDragging } = this.state;

    // Overlay HTML container style for header/menu positioned over the canvas shape
    const containerStyle = {
      position: 'absolute',
      top: y,
      left: x,
      width,
      height,
      transform: `rotate(${rotation}deg)`,
      pointerEvents: 'auto',
      userSelect: 'none',
      zIndex,
      boxSizing: 'border-box',
      padding: 8,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'transparent',
    };

    return (
      <>
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          onClick={this.onDeselect}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <Layer>
            <Group
              x={x}
              y={y}
              rotation={rotation}
              draggable
              onDragStart={this.onDragStart}
              onDragEnd={this.onDragEnd}
              onClick={this.onSelect}
              onTap={this.onSelect}
              ref={this.shapeRef}
              onTransformEnd={this.onTransformEnd}
            >
              <Rect
                width={width}
                height={height}
                fill="white"
                stroke={isSelected ? '#4a90e2' : '#aaa'}
                strokeWidth={isSelected ? 2 : 1}
                cornerRadius={6}
                shadowColor="black"
                shadowBlur={4}
                shadowOpacity={0.1}
                shadowOffset={{ x: 2, y: 2 }}
              />
              {/* Add Konva children if needed */}
            </Group>

            {isSelected && (
              <Transformer
                ref={this.transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 20 || newBox.height < 20) {
                    return oldBox;
                  }
                  return newBox;
                }}
                rotateEnabled={true}
                enabledAnchors={[
                  'top-left',
                  'top-right',
                  'bottom-left',
                  'bottom-right',
                  'top-center',
                  'bottom-center',
                  'middle-left',
                  'middle-right',
                ]}
              />
            )}
          </Layer>
        </Stage>

        {/* Overlay HTML UI (header/buttons/menu) */}
        <div
          style={containerStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 8,
              overflow: 'hidden',
              userSelect: 'none',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexGrow: 1,
                flexShrink: 1,
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={this.toggleMenu}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title="Options"
                aria-label="Toggle settings menu"
              >
                <Settings size={16} strokeWidth={2} />
              </button>

              <FigureTitle title={title} onChange={this.onTitleChange} />
            </div>

            <div
              ref={this.dragHandleRef}
              onMouseDown={this.handleDragHandleMouseDown}
              style={{
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                marginLeft: 8,
                flexShrink: 0,
                padding: '4px 0',
              }}
              title="Drag tile"
            >
              <Move size={16} strokeWidth={2} />
            </div>
          </div>

          {/* Settings menu */}
          {showMenu && tempSettings && (
            <SettingsMenu
              settings={tempSettings}
              schema={schema}
              onChange={this.handleSettingChange}
              onApply={this.applySettings}
              onDelete={this.handleDelete}
            />
          )}

          {/* Content */}
          <div
            style={{
              flexGrow: 1,
              overflow: 'hidden',
              height: `calc(100% - ${showMenu ? 100 : 36}px)`,
              pointerEvents: 'auto',
            }}
          >
            {children}
          </div>
        </div>
      </>
    );
  }
}