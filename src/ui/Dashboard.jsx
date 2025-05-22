import React from 'react';
import Sidebar from './Sidebar';
import FigureGrid from './FigureGrid';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.registryManager = props.registryManager;
    this.factoryManager = props.factoryManager;

    // Try loading from localStorage
    let savedState = null;
    try {
      const saved = localStorage.getItem('dashboard-layout');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.figures && parsed.layout) {
          savedState = {
            figures: parsed.figures,
            layout: parsed.layout,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load saved layout from localStorage:', e);
    }

    this.state = savedState || {
      figures: [],
      layout: [],
    };
  }

  findNextFreePosition(layout, w, h, step = 20) {
    let y = 0;
    while (y < 10000) {
      for (let x = 0; x < 3000; x += step) {
        const collides = layout.some(item => {
          const xOverlap = x < item.x + item.width && x + w > item.x;
          const yOverlap = y < item.y + item.height && y + h > item.y;
          return xOverlap && yOverlap;
        });
        if (!collides) {
          return { x, y };
        }
      }
      y += step;
    }
    return { x: 0, y: 0 };
  }

  handleAddFigure = (figureType) => {
    const figureFactory = this.factoryManager.get('figures');
    if (!figureFactory) {
      console.warn("Figure factory not found");
      return;
    }

    const tempFigure = figureFactory.create({ type: figureType });
    if (!tempFigure) {
      console.warn(`Could not create figure of type '${figureType}'`);
      return;
    }

    const newFigure = tempFigure.toJSON();
    newFigure.title = `${figureType} (${newFigure.id})`;

    const width = 400;
    const height = 300;
    const pos = this.findNextFreePosition(this.state.layout, width, height);

    const layoutItem = {
      id: newFigure.id,
      x: pos.x,
      y: pos.y,
      width,
      height,
    };

    this.setState((prev) => ({
      figures: [...prev.figures, newFigure],
      layout: [...prev.layout, layoutItem],
    }));
  };

  handleTitleChange = (id, newTitle) => {
    this.setState((prev) => ({
      figures: prev.figures.map((f) =>
        f.id === id ? { ...f, title: newTitle } : f
      ),
    }));
  };

  handleDeleteFigure = (id) => {
    this.setState((prev) => ({
      figures: prev.figures.filter((f) => f.id !== id),
      layout: prev.layout.filter((l) => l.id !== id),
    }));
  };

  handleLayoutChange = (newLayout) => {
    this.setState({ layout: newLayout });
  };

  handleFiguresChange = (updatedFigures) => {
    this.setState({ figures: updatedFigures });
  };

  handleClearLayout = () => {
    if (window.confirm('Are you sure you want to clear the entire layout?')) {
      this.setState({
        figures: [],
        layout: [],
      });
      localStorage.removeItem('dashboard-layout');
    }
  };

  handleExport = () => {
    const dataStr = JSON.stringify(this.toJSON(), null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-layout.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  handleImport = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      this.fromJSON(parsed);
      localStorage.setItem('dashboard-layout', JSON.stringify(parsed));
    } catch (e) {
      alert('Failed to parse JSON');
    }
  };

  toJSON = () => ({
    figures: this.state.figures,
    layout: this.state.layout,
  });

  fromJSON = (json) => {
    if (json && Array.isArray(json.figures) && Array.isArray(json.layout)) {
      this.setState({
        figures: json.figures,
        layout: json.layout,
      });
    } else {
      alert('Invalid layout JSON');
    }
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.figures !== this.state.figures ||
      prevState.layout !== this.state.layout
    ) {
      try {
        localStorage.setItem(
          'dashboard-layout',
          JSON.stringify({
            figures: this.state.figures,
            layout: this.state.layout,
          })
        );
      } catch (e) {
        console.warn('Failed to save layout to localStorage:', e);
      }
    }
  }

  render() {
    const { figures, layout } = this.state;
    const figureFactory = this.factoryManager.get('figures');

    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar
          figureTypes={this.registryManager.get('figures').getNames()}
          onAddFigure={this.handleAddFigure}
          onExport={this.handleExport}
          onImport={this.handleImport}
          onClearLayout={this.handleClearLayout}
        />
        <FigureGrid
          figures={figures}
          layout={layout}
          onLayoutChange={this.handleLayoutChange}
          onDeleteFigure={this.handleDeleteFigure}
          onTitleChange={this.handleTitleChange}
          onFiguresChange={this.handleFiguresChange}
          figureFactory={figureFactory}
        />
      </div>
    );
  }
}

export default Dashboard;
