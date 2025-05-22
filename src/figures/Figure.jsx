import React from 'react';

export default class Figure extends React.Component {
  constructor(props) {
    super(props);
    this.id = props.id || `figure_${Math.random().toString(36).substr(2, 9)}`;
    this.title = props.title || "Untitled Figure";
    this.settings = props.settings || {};
  }

  render() {
    return <div>Figure base class (override render!)</div>;
  }

  toJSON() {
    return {
      type: this.constructor.figureName || this.constructor.name,
      id: this.id,
      title: this.title,
      settings: this.settings,
    };
  }
}
