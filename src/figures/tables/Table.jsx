// src/figures/Table.jsx
import Figure from '../Figure';

export default class Table extends Figure {
  static displayName = 'Table';
  static name = 'Table';
  render() {
    return <div>{this.title} (Table base class - override render!)</div>;
  }
}
