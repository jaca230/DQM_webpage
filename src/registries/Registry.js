// src/registries/Registry.js
export default class Registry {
  constructor() {
    this.registry = new Map();
  }

  register(name, item) {
    if (this.registry.has(name)) {
      console.warn(`Registry: '${name}' is already registered`);
    }
    this.registry.set(name, item);
  }

  get(name) {
    return this.registry.get(name);
  }

  getAll() {
    return Array.from(this.registry.entries());
  }

  getNames() {
    return Array.from(this.registry.keys());
  }

  has(name) {
    return this.registry.has(name);
  }
}
