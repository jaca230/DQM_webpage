// src/factories/FigureFactory.js
import Factory from './Factory';

export default class FigureFactory extends Factory {
  create(config) {
    const { type, id, title, settings } = config;

    // Debug: Log what we're looking for and what's available
    console.log('FigureFactory.create called with type:', type);
    console.log('Available figure types:', this.registry.getNames());

    const FigureClass = this.registry.get(type);

    if (!FigureClass) {
      console.warn(`FigureFactory: Unknown figure type '${type}'`);
      console.warn('Available types:', this.registry.getNames());
      return null;
    }

    console.log('Found FigureClass:', FigureClass.name || FigureClass.displayName);
    return new FigureClass({ id, title, settings });
  }
}
