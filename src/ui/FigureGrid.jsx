// FigureGrid.jsx
import React from 'react';
import FigureTile from './FigureTile';

class FigureGrid extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      zoom: 1,
      containerWidth: window.innerWidth,
      containerHeight: window.innerHeight,
      layout: props.layout || [],
      zIndices: {},
      maxZ: 1,
    };

    this.containerRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateContainerSize);
    this.updateContainerSize();

    const initialZ = {};
    (this.props.figures || []).forEach((fig, idx) => {
      initialZ[fig.id] = idx + 1;
    });
    this.setState({ zIndices: initialZ, maxZ: (this.props.figures || []).length });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateContainerSize);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.figures !== this.props.figures) {
      const newZIndices = { ...this.state.zIndices };
      let maxZ = this.state.maxZ;
      this.props.figures.forEach((fig) => {
        if (!(fig.id in newZIndices)) {
          maxZ++;
          newZIndices[fig.id] = maxZ;
        }
      });
      if (maxZ !== this.state.maxZ) {
        this.setState({ zIndices: newZIndices, maxZ });
      }
    }

    if (prevProps.layout !== this.props.layout) {
      this.setState({ layout: this.props.layout });
    }

    if (prevProps.sidebarCollapsed !== this.props.sidebarCollapsed) {
      setTimeout(this.updateContainerSize, 300);
    }
  }

  updateContainerSize = () => {
    if (this.containerRef.current) {
      const { clientWidth, clientHeight } = this.containerRef.current;
      this.setState({ containerWidth: clientWidth, containerHeight: clientHeight });
    }
  };

  bringToFront = (id) => {
    this.setState((prev) => {
      const newMaxZ = prev.maxZ + 1;
      return {
        zIndices: { ...prev.zIndices, [id]: newMaxZ },
        maxZ: newMaxZ,
      };
    });
  };

  updateLayoutItem = (id, changes) => {
    this.setState((prev) => {
      const newLayout = prev.layout.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      );
      this.props.onLayoutChange?.(newLayout);
      return { layout: newLayout };
    });
  };

  updateFigureSettings = (id, newSettings) => {
    const updatedFigures = this.props.figures.map((fig) =>
      fig.id === id ? { ...fig, settings: { ...newSettings } } : fig
    );
    this.props.onFiguresChange?.(updatedFigures);
  };

  updateFigureRotation = (id, rotation) => {
    this.setState((prev) => {
      const newLayout = prev.layout.map((item) =>
        item.id === id ? { ...item, rotation } : item
      );
      this.props.onLayoutChange?.(newLayout);
      return { layout: newLayout };
    });
    this.bringToFront(id);
  };

  onDragStop = (id, d) => {
    this.updateLayoutItem(id, { x: d.x, y: d.y });
    this.bringToFront(id);
  };

  onResizeStop = (id, ref, position) => {
    const width = parseInt(ref.style.width, 10);
    const height = parseInt(ref.style.height, 10);
    this.updateLayoutItem(id, { width, height, x: position.x, y: position.y });
    this.bringToFront(id);
  };

  calculateRequiredCanvasSize() {
    const { layout, zoom, containerWidth, containerHeight } = this.state;
    if (layout.length === 0) {
      return { width: containerWidth, height: containerHeight };
    }

    let maxX = 0, maxY = 0;
    layout.forEach((item) => {
      const right = item.x + item.width;
      const bottom = item.y + item.height;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    });

    const avgWidth = layout.reduce((sum, item) => sum + item.width, 0) / layout.length;
    const avgHeight = layout.reduce((sum, item) => sum + item.height, 0) / layout.length;
    const padding = Math.min(avgWidth * 0.2, avgHeight * 0.2, 200);

    const figuresWidth = maxX + padding;
    const figuresHeight = maxY + padding;

    const zoomWidth = containerWidth / zoom;
    const zoomHeight = containerHeight / zoom;

    return {
      width: Math.max(figuresWidth, zoomWidth),
      height: Math.max(figuresHeight, zoomHeight),
    };
  }

  render() {
    const { figures, onDeleteFigure, onTitleChange, figureFactory } = this.props;
    const { zIndices } = this.state;
    const { width: canvasWidth, height: canvasHeight } = this.calculateRequiredCanvasSize();

    return (
      <div
        ref={this.containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          height: '100%',
          background: '#f0f0f0',
          border: '1px solid #ccc',
          transition: 'width 0.3s',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: canvasWidth,
            height: canvasHeight,
            background: 'white',
            transformOrigin: 'top left',
            transform: `scale(${this.state.zoom})`,
            transition: 'width 0.3s, height 0.3s',
          }}
        >
          {figures.map((fig) => {
            const layoutItem = this.state.layout.find((l) => l.id === fig.id);
            if (!layoutItem) return null;

            const FigureComponent = figureFactory.registry.get(fig.type);
            const zIndex = zIndices[fig.id] || 1;
            const schema = FigureComponent?.settingSchema || {};

            return (
              <FigureTile
                key={fig.id}
                id={fig.id}
                x={layoutItem.x}
                y={layoutItem.y}
                width={layoutItem.width}
                height={layoutItem.height}
                zIndex={zIndex}
                rotation={layoutItem.rotation || 0}
                title={fig.title}
                settings={fig.settings}
                schema={schema}
                onDelete={() => onDeleteFigure(fig.id)}
                onTitleChange={(newTitle) => onTitleChange(fig.id, newTitle)}
                onSettingsChange={(newSettings) => this.updateFigureSettings(fig.id, newSettings)}
                onRotationChange={(rotation) => this.updateFigureRotation(fig.id, rotation)}
                onDragStop={(d) => this.onDragStop(fig.id, d)}
                onResizeStop={(ref, position) => this.onResizeStop(fig.id, ref, position)}
              >
                {FigureComponent ? (
                  <FigureComponent
                    key={fig.id}
                    id={fig.id}
                    title={fig.title}
                    settings={fig.settings}
                    onSettingsCorrected={(correctedSettings) =>
                      this.updateFigureSettings(fig.id, correctedSettings)
                    }
                  />
                ) : (
                  <div>Unknown figure type: {fig.type}</div>
                )}
              </FigureTile>
            );
          })}
        </div>
      </div>
    );
  }
}

export default FigureGrid;
