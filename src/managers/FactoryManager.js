export default class FactoryManager {
  constructor() {
    this.factories = new Map();
  }

  add(name, factoryInstance) {
    if (this.factories.has(name)) {
      console.warn(`Factory '${name}' already exists. Overwriting.`);
    }
    this.factories.set(name, factoryInstance);
  }

  get(name) {
    if (!this.factories.has(name)) {
      console.warn(`Factory '${name}' not found.`);
    }
    return this.factories.get(name);
  }

  list() {
    return Array.from(this.factories.keys());
  }
}
