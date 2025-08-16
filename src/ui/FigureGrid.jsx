import React from 'react';
import FigureTile from './FigureTile';
import { Rnd } from 'react-rnd';
import 'react-resizable/css/styles.css';

class FigureGrid extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      zoom: 1,
      containerWidth: window.innerWidth,
      containerHeight: window.innerHeight,
      layout: props.layout || [],
    };

    this.containerRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateContainerSize);
    this.updateContainerSize();

    // Initialize z-indices for any layout items that don't have them
    this.ensureZIndicesExist();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateContainerSize);
  }

  componentDidUpdate(prevProps) {
    // Handle new figures added after mount
    if (prevProps.figures !== this.props.figures || prevProps.layout !== this.props.layout) {
      this.ensureZIndicesExist();
    }

    // Update layout state if layout prop changes
    if (prevProps.layout !== this.props.layout) {
      this.setState({ layout: this.props.layout });
    }

    // Handle sidebar collapse state changes
    if (prevProps.sidebarCollapsed !== this.props.sidebarCollapsed) {
      // Add a small delay to let the sidebar animation complete
      setTimeout(this.updateContainerSize, 300);
    }
  }

  /**
   * Ensure all layout items have z-index values
   */
  ensureZIndicesExist = () => {
    const { layout } = this.props;
    let needsUpdate = false;
    let maxZ = Math.max(...layout.map(item => item.zIndex || 0), 0);

    const updatedLayout = layout.map((item) => {
      if (typeof item.zIndex !== 'number') {
        needsUpdate = true;
        maxZ++;
        return { ...item, zIndex: maxZ };
      }
      return item;
    });

    if (needsUpdate) {
      this.setState({ layout: updatedLayout });
      this.props.onLayoutChange?.(updatedLayout);
    }
  };

  updateContainerSize = () => {
    if (this.containerRef.current) {
      const { clientWidth, clientHeight } = this.containerRef.current;
      this.setState(
        {
          containerWidth: clientWidth,
          containerHeight: clientHeight,
        },
        () => {
          // Force recalculation of canvas size after container update
          const canvas = this.containerRef.current.firstChild;
          if (canvas) {
            const { width, height } = this.calculateRequiredCanvasSize();
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            canvas.style.transition = 'none';
          }
        }
      );
    }
  };

  /**
   * Bring a figure to front by setting its z-index to max + 1
   */
  bringToFront = (id) => {
    this.setState((prev) => {
      const maxZ = Math.max(...prev.layout.map(item => item.zIndex || 0), 0);
      
      const newLayout = prev.layout.map((item) =>
        item.id === id ? { ...item, zIndex: maxZ + 1 } : item
      );
      
      this.props.onLayoutChange?.(newLayout);
      return { layout: newLayout };
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
    const { layout, zoom } = this.state;
    const { containerWidth, containerHeight } = this.state;

    if (layout.length === 0) {
      return {
        width: containerWidth,
        height: containerHeight,
      };
    }

    // Calculate the maximum extent of all figures
    let maxX = 0;
    let maxY = 0;

    layout.forEach((item) => {
      const right = item.x + item.width;
      const bottom = item.y + item.height;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    });

    // Add some padding (20% of average figure size or 200px, whichever is smaller)
    const avgWidth = layout.reduce((sum, item) => sum + item.width, 0) / layout.length;
    const avgHeight = layout.reduce((sum, item) => sum + item.height, 0) / layout.length;
    const padding = Math.min(avgWidth * 0.2, avgHeight * 0.2, 200);

    // Calculate required size based on figures
    const figuresWidth = maxX + padding;
    const figuresHeight = maxY + padding;

    // Calculate required size based on zoom
    const zoomWidth = containerWidth / zoom;
    const zoomHeight = containerHeight / zoom;

    // Use whichever is larger
    return {
      width: Math.max(figuresWidth, zoomWidth),
      height: Math.max(figuresHeight, zoomHeight),
    };
  }

  render() {
    const { figures, onDeleteFigure, onTitleChange, figureFactory } = this.props;
    const { zoom } = this.state;
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
            transform: `scale(${zoom})`,
            transition: 'width 0.3s, height 0.3s',
          }}
        >
          {figures.map((fig) => {
            const layoutItem = this.state.layout.find((l) => l.id === fig.id);
            if (!layoutItem) return null;

            const FigureComponent = figureFactory.registry.get(fig.type);
            const zIndex = layoutItem.zIndex || 1;

            // Get settingSchema from the figure class, default to empty object
            const schema = FigureComponent?.settingSchema || {};

            return (
              <Rnd
                key={fig.id}
                size={{ width: layoutItem.width, height: layoutItem.height }}
                position={{ x: layoutItem.x, y: layoutItem.y }}
                onDragStop={(e, d) => this.onDragStop(fig.id, d)}
                onResizeStop={(e, direction, ref, delta, position) =>
                  this.onResizeStop(fig.id, ref, position)
                }
                bounds="parent"
                dragHandleClassName="drag-handle"
                enableResizing={{
                  top: true,
                  right: true,
                  bottom: true,
                  left: true,
                  topRight: true,
                  bottomRight: true,
                  bottomLeft: true,
                  topLeft: true,
                }}
                style={{
                  border: '1px solid #aaa',
                  background: 'white',
                  borderRadius: 6,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  zIndex,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <FigureTile
                  title={fig.title}
                  settings={fig.settings}
                  schema={schema}
                  onDelete={() => onDeleteFigure(fig.id)}
                  onTitleChange={(newTitle) => onTitleChange(fig.id, newTitle)}
                  onSettingsChange={(newSettings) => this.updateFigureSettings(fig.id, newSettings)}
                  onBringToFront={() => this.bringToFront(fig.id)}
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
              </Rnd>
            );
          })}
        </div>
      </div>
    );
  }
}

export default FigureGrid;