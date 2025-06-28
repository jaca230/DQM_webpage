// src/init-registries.js
import RegistryManager from '../managers/RegistryManager';
import FigureRegistry from './FigureRegistry';

export default function initRegistries() {
  const registryManager = new RegistryManager();

  const figureRegistry = new FigureRegistry();
  registryManager.add('figures', figureRegistry);

  return registryManager;
}
