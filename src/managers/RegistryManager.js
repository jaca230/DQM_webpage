class RegistryManager {
  constructor() {
    this.registries = new Map();
  }

  /**
   * Add a registry under a given key
   * @param {string} name - Unique name of the registry (e.g., 'figure')
   * @param {object} registryInstance - An instance of a Registry subclass
   */
  add(name, registryInstance) {
    if (this.registries.has(name)) {
      console.warn(`Registry '${name}' already exists. Overwriting.`);
    }
    this.registries.set(name, registryInstance);
  }

  /**
   * Get a registry by name
   * @param {string} name
   * @returns {object} registryInstance
   */
  get(name) {
    if (!this.registries.has(name)) {
      console.warn(`Registry '${name}' not found.`);
    }
    return this.registries.get(name);
  }

  /**
   * Optional: get all registry names
   */
  list() {
    return Array.from(this.registries.keys());
  }
}

export default RegistryManager;
