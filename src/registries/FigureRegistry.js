// src/registries/FigureRegistry.js
import Registry from './Registry';

export default class FigureRegistry extends Registry {
  constructor() {
    super();

    // Explicit ignore rules
    const ignoreFiles = [
      'StaticFigure.jsx',
      'BaseFigure.jsx',
      'Figure.jsx',
      'Plot.jsx',
      'Table.jsx',
    ];

    const ignoreDirs = [
      '/strategies/',   // skip all strategy classes
    ];

    const context = require.context('../figures', true, /\.jsx?$/);

    context.keys().forEach((key) => {
      const filename = key.split('/').pop();

      // Check file-level ignores
      if (ignoreFiles.includes(filename)) return;

      // Check directory-level ignores
      if (ignoreDirs.some((dir) => key.includes(dir))) return;

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
