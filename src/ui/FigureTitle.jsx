import React from 'react';

export default class FigureTitle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: false,
      editTitle: props.title,
    };
  }

  startEditing = () => {
    this.setState({ editing: true, editTitle: this.props.title }, () => {
      this.inputRef?.focus();
      this.inputRef?.select();
    });
  };

  stopEditing = () => {
    this.setState({ editing: false });
    if (this.state.editTitle !== this.props.title) {
      this.props.onChange(this.state.editTitle);
    }
  };

  onInputChange = (e) => {
    this.setState({ editTitle: e.target.value });
  };

  onInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      this.stopEditing();
    } else if (e.key === 'Escape') {
      this.setState({ editing: false, editTitle: this.props.title });
    }
  };

  render() {
    const { editing, editTitle } = this.state;

    if (editing) {
      return (
        <input
          ref={(el) => (this.inputRef = el)}
          className="no-drag"
          type="text"
          value={editTitle}
          onChange={this.onInputChange}
          onBlur={this.stopEditing}
          onKeyDown={this.onInputKeyDown}
          style={{
            width: '100%',
            fontWeight: 'bold',
            fontSize: '1rem',
            padding: '2px 4px',
            borderRadius: '4px',
            border: '1px solid #aaa',
          }}
        />
      );
    }

    return (
      <strong
        onDoubleClick={this.startEditing}
        className="no-drag"
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block',
          minWidth: 0,
          flexShrink: 1,
          fontWeight: 'bold',
        }}
        title={this.props.title}
      >
        {this.props.title}
      </strong>
    );
  }
}
