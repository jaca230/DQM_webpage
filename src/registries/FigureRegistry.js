// src/registries/FigureRegistry.js
import Registry from './Registry';

export default class FigureRegistry extends Registry {
  constructor() {
    super();

    const context = require.context('../figures', true, /\.jsx?$/);
    const ignoreFiles = ['StaticFigure.jsx', 'BaseFigure.jsx', 'Figure.jsx', 'Plot.jsx', 'Table.jsx'];

    context.keys().forEach((key) => {
      const filename = key.split('/').pop();
      if (ignoreFiles.includes(filename)) return;

      const module = context(key);
      const FigureClass = module.default;

      if (FigureClass && FigureClass.name) {
        this.register(FigureClass.name, FigureClass);
      } else {
        console.warn(`Skipping figure in ${key}: no class name`);
      }
    });
  }
}
