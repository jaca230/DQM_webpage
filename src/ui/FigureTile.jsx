// FigureTile.jsx
import React from 'react';
import { Group, Rect, Text, Transformer } from 'react-konva';

export default class FigureTile extends React.Component {
  shapeRef = React.createRef();
  transformerRef = React.createRef();

  componentDidMount() {
    this.updateTransformer();
  }

  componentDidUpdate(prevProps) {
    if (this.props.isSelected !== prevProps.isSelected) {
      this.updateTransformer();
    }
  }

  updateTransformer = () => {
    if (this.transformerRef.current && this.shapeRef.current) {
      if (this.props.isSelected) {
        this.transformerRef.current.nodes([this.shapeRef.current]);
      } else {
        this.transformerRef.current.nodes([]);
      }
      this.transformerRef.current.getLayer()?.batchDraw();
    }
  };

  handleDragEnd = (e) => {
    const { x, y } = e.target.position();
    this.props.onPositionChange && this.props.onPositionChange({ x, y });
  };

  handleTransformEnd = () => {
    const node = this.shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(40, node.width() * scaleX);
    const newHeight = Math.max(40, node.height() * scaleY);
    const rotation = node.rotation();
    const { x, y } = node.position();

    this.props.onTransform &&
      this.props.onTransform({
        width: newWidth,
        height: newHeight,
        rotation,
        x,
        y,
      });
  };

  render() {
    const {
      x = 50,
      y = 50,
      width = 200,
      height = 150,
      rotation = 0,
      title = 'Tile',
      fill = '#ffffff',
      stroke = '#aaaaaa',
      strokeWidth = 2,
      cornerRadius = 8,
      isSelected = false,
      onSelect,
    } = this.props;

    return (
      <>
        <Group
          ref={this.shapeRef}
          x={x}
          y={y}
          width={width}
          height={height}
          rotation={rotation}
          draggable
          onDragEnd={this.handleDragEnd}
          onTransformEnd={this.handleTransformEnd}
          onClick={(e) => {
            e.cancelBubble = true; // Prevent Stage click deselect
            onSelect && onSelect();
          }}
        >
          <Rect
            width={width}
            height={height}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            cornerRadius={cornerRadius}
            shadowBlur={4}
            shadowOpacity={0.2}
          />
          <Text
            text={title}
            fontSize={16}
            fontStyle="bold"
            x={8}
            y={8}
            width={width - 16}
            height={24}
            fill="#222222"
            ellipsis
          />
        </Group>

        {isSelected && (
          <Transformer
            ref={this.transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Minimum size enforcement
              if (newBox.width < 40 || newBox.height < 40) {
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
      </>
    );
  }
}
