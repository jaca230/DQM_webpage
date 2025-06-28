/**
 * Manages figure operations including creation, deletion, positioning, and updates
 */
export default class FigureManager {
  constructor(factoryManager) {
    this.factoryManager = factoryManager;
    this.listeners = new Set();
  }

  /**
   * Add a change listener
   * @param {Function} listener - Called when figures change
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove a change listener
   * @param {Function} listener - Listener to remove
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   * @param {Array} figures - Updated figures array
   * @param {Array} layout - Updated layout array
   */
  notifyListeners(figures, layout) {
    this.listeners.forEach(listener => listener({ figures, layout }));
  }

  /**
   * Find next free position for a figure
   * @param {Array} layout - Current layout array
   * @param {number} width - Figure width
   * @param {number} height - Figure height
   * @param {number} step - Step size for position search
   * @returns {Object} Position object with x and y coordinates
   */
  findNextFreePosition(layout, width, height, step = 20) {
    let y = 0;
    while (y < 10000) {
      const currentY = y;
      for (let x = 0; x < 3000; x += step) {
        const collides = layout.some(item => {
          const xOverlap = x < item.x + item.width && x + width > item.x;
          const yOverlap = currentY < item.y + item.height && currentY + height > item.y;
          return xOverlap && yOverlap;
        });
        if (!collides) {
          return { x, y: currentY };
        }
      }
      y += step;
    }
    return { x: 0, y: 0 };
  }

  /**
   * Create a new figure
   * @param {string} figureType - Type of figure to create
   * @param {Array} currentFigures - Current figures array
   * @param {Array} currentLayout - Current layout array
   * @param {Object} options - Figure creation options
   * @returns {Object|null} Object with new figure and layout item, or null if failed
   */
  createFigure(figureType, currentFigures, currentLayout, options = {}) {
    const figureFactory = this.factoryManager.get('figures');
    if (!figureFactory) {
      console.warn("Figure factory not found");
      return null;
    }

    const tempFigure = figureFactory.create({ type: figureType });
    if (!tempFigure) {
      console.warn(`Could not create figure of type '${figureType}'`);
      return null;
    }

    const newFigure = tempFigure.toJSON();
    newFigure.title = options.title || `${figureType} (${newFigure.id})`;

    const width = options.width || 400;
    const height = options.height || 300;
    const position = options.position || this.findNextFreePosition(currentLayout, width, height);

    const layoutItem = {
      id: newFigure.id,
      x: position.x,
      y: position.y,
      width,
      height,
    };

    return {
      figure: newFigure,
      layoutItem: layoutItem
    };
  }

  /**
   * Add a figure to the given arrays
   * @param {string} figureType - Type of figure to create
   * @param {Array} figures - Current figures array
   * @param {Array} layout - Current layout array
   * @param {Object} options - Figure creation options
   * @returns {Object|null} Object with updated figures and layout arrays
   */
  addFigure(figureType, figures, layout, options = {}) {
    const result = this.createFigure(figureType, figures, layout, options);
    if (!result) {
      return null;
    }

    const newFigures = [...figures, result.figure];
    const newLayout = [...layout, result.layoutItem];

    this.notifyListeners(newFigures, newLayout);
    return {
      figures: newFigures,
      layout: newLayout
    };
  }

  /**
   * Delete a figure by ID
   * @param {string} figureId - ID of figure to delete
   * @param {Array} figures - Current figures array
   * @param {Array} layout - Current layout array
   * @returns {Object} Object with updated figures and layout arrays
   */
  deleteFigure(figureId, figures, layout) {
    const newFigures = figures.filter(f => f.id !== figureId);
    const newLayout = layout.filter(l => l.id !== figureId);

    this.notifyListeners(newFigures, newLayout);
    return {
      figures: newFigures,
      layout: newLayout
    };
  }

  /**
   * Update a figure's title
   * @param {string} figureId - ID of figure to update
   * @param {string} newTitle - New title for the figure
   * @param {Array} figures - Current figures array
   * @returns {Array} Updated figures array
   */
  updateFigureTitle(figureId, newTitle, figures) {
    const newFigures = figures.map(f =>
      f.id === figureId ? { ...f, title: newTitle } : f
    );

    this.notifyListeners(newFigures, null); // Layout unchanged
    return newFigures;
  }

  /**
   * Update figure data
   * @param {string} figureId - ID of figure to update
   * @param {Object} updates - Object with properties to update
   * @param {Array} figures - Current figures array
   * @returns {Array} Updated figures array
   */
  updateFigure(figureId, updates, figures) {
    const newFigures = figures.map(f =>
      f.id === figureId ? { ...f, ...updates } : f
    );

    this.notifyListeners(newFigures, null); // Layout unchanged
    return newFigures;
  }

  /**
   * Update layout for figures
   * @param {Array} newLayout - New layout array
   * @param {Array} figures - Current figures array (for notification)
   * @returns {Array} The new layout array
   */
  updateLayout(newLayout, figures) {
    this.notifyListeners(figures, newLayout);
    return newLayout;
  }

  /**
   * Batch update multiple figures
   * @param {Array} updatedFigures - Array of updated figures
   * @param {Array} layout - Current layout array (for notification)
   * @returns {Array} The updated figures array
   */
  updateFigures(updatedFigures, layout) {
    this.notifyListeners(updatedFigures, layout);
    return updatedFigures;
  }

  /**
   * Get figure by ID
   * @param {string} figureId - ID of figure to find
   * @param {Array} figures - Figures array to search
   * @returns {Object|null} Figure object or null if not found
   */
  getFigureById(figureId, figures) {
    return figures.find(f => f.id === figureId) || null;
  }

  /**
   * Get layout item by ID
   * @param {string} figureId - ID of layout item to find
   * @param {Array} layout - Layout array to search
   * @returns {Object|null} Layout item or null if not found
   */
  getLayoutItemById(figureId, layout) {
    return layout.find(l => l.id === figureId) || null;
  }

  /**
   * Validate figures and layout consistency
   * @param {Array} figures - Figures array
   * @param {Array} layout - Layout array
   * @returns {Object} Validation result with isValid boolean and issues array
   */
  validateConsistency(figures, layout) {
    const issues = [];
    const figureIds = new Set(figures.map(f => f.id));
    const layoutIds = new Set(layout.map(l => l.id));

    // Check for figures without layout items
    figureIds.forEach(id => {
      if (!layoutIds.has(id)) {
        issues.push(`Figure ${id} has no layout item`);
      }
    });

    // Check for layout items without figures
    layoutIds.forEach(id => {
      if (!figureIds.has(id)) {
        issues.push(`Layout item ${id} has no corresponding figure`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Clean up orphaned layout items
   * @param {Array} figures - Figures array
   * @param {Array} layout - Layout array
   * @returns {Array} Cleaned layout array
   */
  cleanupLayout(figures, layout) {
    const figureIds = new Set(figures.map(f => f.id));
    return layout.filter(l => figureIds.has(l.id));
  }
}