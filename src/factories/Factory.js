// src/factories/Factory.js
export default class Factory {
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Create an instance by type name.
   * Override in subclasses if you need custom creation logic.
   */
  create(config) {
    const { type, ...rest } = config;
    const Class = this.registry.get(type);

    if (!Class) {
      console.warn(`Factory: Unknown type '${type}'`);
      return null;
    }

    return new Class(rest);
  }
}
