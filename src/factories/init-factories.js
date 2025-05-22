// src/init-factories.js
import FactoryManager from './FactoryManager';
import FigureFactory from './FigureFactory';

export default function initFactories(registryManager) {
  const factoryManager = new FactoryManager();

  const figureRegistry = registryManager.get('figures');
  const figureFactory = new FigureFactory(figureRegistry);
  factoryManager.add('figures', figureFactory);

  return factoryManager;
}
