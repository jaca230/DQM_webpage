import React from 'react';

class Sidebar extends React.Component {
  fileInputRef = React.createRef();
  state = {
    selectedFigureType: '',
  };

  onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      this.props.onImport(evt.target.result);
      e.target.value = null; // reset file input
    };
    reader.readAsText(file);
  };

  onFigureTypeChange = (e) => {
    this.setState({ selectedFigureType: e.target.value });
  };

  onAddSelectedFigure = () => {
    if (this.state.selectedFigureType) {
      this.props.onAddFigure(this.state.selectedFigureType);
      this.setState({ selectedFigureType: '' });
    }
  };

  render() {
    const { figureTypes, onExport, onClearLayout } = this.props;
    const { selectedFigureType } = this.state;

    return (
      <div
        style={{
          width: '200px',
          padding: '1rem',
          borderRight: '1px solid #ccc',
          backgroundColor: '#f8f8f8',
          height: '100vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <h3>Layout</h3>
        <button
          onClick={onExport}
          style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
        >
          Export Layout
        </button>
        <button
          onClick={() => this.fileInputRef.current && this.fileInputRef.current.click()}
          style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
        >
          Import Layout
        </button>
        <input
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          ref={this.fileInputRef}
          onChange={this.onFileChange}
        />
        <button
          onClick={onClearLayout}
          style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fdd' }}
        >
          Clear Layout
        </button>

        <h3>Available Figures</h3>
        <select
          value={selectedFigureType}
          onChange={this.onFigureTypeChange}
          style={{ width: '100%', marginBottom: '0.5rem', padding: '0.4rem' }}
        >
          <option value="" disabled>
            Select a figure type...
          </option>
          {figureTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button
          onClick={this.onAddSelectedFigure}
          disabled={!selectedFigureType}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          Add Figure
        </button>
      </div>
    );
  }
}

export default Sidebar;
