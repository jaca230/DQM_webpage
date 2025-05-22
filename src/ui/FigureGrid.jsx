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
      layout: this.props.layout || [],
      zIndices: {},
      maxZ: 1,
    };

    this.containerRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateContainerSize);
    this.updateContainerSize();

    const initialZ = {};
    (this.props.figures || []).forEach((fig) => {
      initialZ[fig.id] = 1;
    });
    this.setState({ zIndices: initialZ });
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
  }

  updateContainerSize = () => {
    if (this.containerRef.current) {
      const { clientWidth, clientHeight } = this.containerRef.current;
      this.setState({
        containerWidth: clientWidth,
        containerHeight: clientHeight,
      });
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
      fig.id === id ? { ...fig, settings: newSettings } : fig
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

  render() {
    const { figures, onDeleteFigure, onTitleChange, figureFactory } = this.props;
    const { zoom, containerWidth, containerHeight, layout, zIndices } = this.state;

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
        }}
      >
        <div
          style={{
            position: 'relative',
            width: containerWidth,
            height: containerHeight,
            background: 'white',
            transformOrigin: 'top left',
            transform: `scale(${zoom})`,
          }}
        >
          {figures.map((fig) => {
            const layoutItem = layout.find((l) => l.id === fig.id);
            if (!layoutItem) return null;

            const FigureComponent = figureFactory.registry.get(fig.type);
            const zIndex = zIndices[fig.id] || 1;

            console.log('Figures in FigureGrid:', this.props.figures);


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
                }}
              >
                <FigureTile
                  title={fig.title}
                  settings={fig.settings}
                  onDelete={() => onDeleteFigure(fig.id)}
                  onTitleChange={(newTitle) => onTitleChange(fig.id, newTitle)}
                  onSettingsChange={(newSettings) => this.updateFigureSettings(fig.id, newSettings)}
                >
                  {FigureComponent ? (
                    <FigureComponent
                      key={JSON.stringify(fig.settings)} // force re-render on settings change
                      id={fig.id}
                      title={fig.title}
                      settings={fig.settings}
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
