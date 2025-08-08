// FigureGrid.jsx
import React from 'react';
import { Stage, Layer } from 'react-konva';
import FigureTile from './FigureTile';

class FigureGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      containerWidth: window.innerWidth,
      containerHeight: window.innerHeight,
      selectedId: null,
    };
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateContainerSize);
    this.updateContainerSize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateContainerSize);
  }

  updateContainerSize = () => {
    if (this.containerRef.current) {
      const { clientWidth, clientHeight } = this.containerRef.current;
      this.setState({ containerWidth: clientWidth, containerHeight: clientHeight });
    }
  };

  selectFigure = (id) => {
    this.setState({ selectedId: id });
  };

  deselectFigure = () => {
    this.setState({ selectedId: null });
  };

  render() {
    const { figures, layout, onDeleteFigure, onTitleChange, figureFactory } = this.props;
    const { containerWidth, containerHeight, selectedId } = this.state;

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
        <Stage
          width={containerWidth}
          height={containerHeight}
          onClick={this.deselectFigure}
        >
          <Layer>
            {figures.map((fig) => {
              const layoutItem = layout.find((l) => l.id === fig.id);
              if (!layoutItem) return null;

              const FigureComponent = figureFactory.registry.get(fig.type);
              const schema = FigureComponent?.settingSchema || {};

              return (
                <FigureTile
                  key={fig.id}
                  id={fig.id}
                  x={layoutItem.x}
                  y={layoutItem.y}
                  width={layoutItem.width}
                  height={layoutItem.height}
                  rotation={layoutItem.rotation || 0}
                  title={fig.title}
                  settings={fig.settings}
                  schema={schema}
                  isSelected={selectedId === fig.id}
                  onSelect={() => this.selectFigure(fig.id)}
                  onDelete={() => onDeleteFigure(fig.id)}
                  onTitleChange={(newTitle) => onTitleChange(fig.id, newTitle)}
                  // Add more handlers as needed
                >
                  {FigureComponent ? (
                    <FigureComponent
                      id={fig.id}
                      title={fig.title}
                      settings={fig.settings}
                    />
                  ) : (
                    <div>Unknown figure type: {fig.type}</div>
                  )}
                </FigureTile>
              );
            })}
          </Layer>
        </Stage>
      </div>
    );
  }
}

export default FigureGrid;
