// src/factories/FigureFactory.js
import Factory from './Factory';

export default class FigureFactory extends Factory {
  constructor(figureRegistry) {
    super(figureRegistry);
  }

  create(config) {
    const { type, id, title, settings } = config;
    const FigureClass = this.registry.get(type);

    if (!FigureClass) {
      console.warn(`FigureFactory: Unknown figure type '${type}'`);
      return null;
    }

    return new FigureClass({ id, title, settings });
  }
}
