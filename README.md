# DQM Webpage Frontend

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)
[![Node.js Version](https://img.shields.io/badge/node-%3E=16.0.0-green)](https://nodejs.org/)
[![NPM Version](https://img.shields.io/badge/npm-%3E=8.0.0-orange)](https://www.npmjs.com/)

## Overview

This is a **React-based frontend application** designed for dynamic data quality monitoring (DQM) visualization. It supports flexible plugin loading, interactive figures, tabbed layouts, and a customizable dashboard interface.

The frontend interacts with backend services (such as FastAPI-based APIs) to fetch and display live data plots, tables, and figures.

---

## Features

* **Dynamic Plugin System**: Load, register, and manage visualization plugins at runtime.
* **Figure Management**: Supports multiple figure types including plots and tables with customizable settings.
* **Dashboard with Tabs**: Organize figures into multiple tabs with drag-resize capabilities.
* **Persistent Layout**: Save and restore dashboard layouts and plugin configurations via local storage.

---

## Installation & Running

```bash
# Clone repo
git clone https://github.com/jaca230/DQM_webpage.git
cd DQM_webpage/frontend

# Install dependencies
npm install

# Start development server
npm start
```

This will launch the React app locally, typically accessible at [http://localhost:3000](http://localhost:3000).

---

## Usage Notes

* **Plugin Management:** Use the plugin management modal to load, unload, import, export, and reset visualization plugins.
* **Dashboard Layout:** Drag and resize figures; layouts are saved automatically and restored on reload.
* **Backend API:** This frontend expects a backend API (e.g., [FastAPI with ZeroMQ receiver](https://github.com/jaca230/ZMQSUB_to_FastAPI)) to provide live data endpoints.
* **Local Storage:** User settings and plugin lists are persisted in local storage.

---

## Dependencies

* React 18+
* React DOM
* Various UI helper libraries (see package.json for full list)

---

# Creating a Custom Figure Locally (Simplest)

If you want to quickly add a new custom figure directly inside the DQM Webpage frontend without building a separate plugin, follow these steps:

---

## Add Your Figure Class in `/src/figures`

Create a new `.jsx` file in the `/src/figures` directory, for example `MyCustomPlot.jsx`.

Example:

```jsx
import React from 'react';
import Plot from './Plot';  // or Table, Figure etc.
import SettingTypes from '../enums/SettingTypes';

export default class MyCustomPlot extends Plot {
  static displayName = 'My Custom Plot';
  static name = 'MyCustomPlot';

  static get settingSchema() {
    return {
      ...super.settingSchema,
      dataUrl: {
        type: SettingTypes.STRING,
        default: 'http://localhost/api/my_data',
        label: 'Data URL',
        onChange: 'onUpdateTick',
      },
      customSetting: {
        type: SettingTypes.INT,
        default: 42,
        label: 'Custom Setting',
      },
    };
  }

  initPlot(json) {
    // Build initial plot data and layout from json
    return {
      data: [
        {
          x: json.time || [],
          y: json.value || [],
          type: 'scatter',
          mode: 'lines+markers',
          marker: { color: 'green' },
        },
      ],
      layout: {
        autosize: true,
        margin: { t: 30, r: 20, l: 40, b: 40 },
        xaxis: { title: 'Time' },
        yaxis: { title: 'Value' },
      },
    };
  }

  updatePlot(json) {
    // Update only the data, keep layout unchanged
    return {
      data: [
        {
          x: json.time || [],
          y: json.value || [],
          type: 'scatter',
          mode: 'lines+markers',
          marker: { color: 'green' },
        },
      ],
      layout: undefined,
    };
  }
}
```

## Notes

* If placed in the "Figures" folder, the figure should automatically be registered on app intialization.
* This approach is best for quick local development or small customizations.
* No separate build step or plugin packaging is needed.
* Your figure can access all frontend base classes like `Plot`, `Table`, `SettingTypes`, etc. by importing them directly.
* Data URLs and settings are configurable via the UI.

---


# Creating a Custom Figure Plugin for DQM Webpage (Advanced)

This tutorial guides you through building a custom figure plugin for the **DQM Webpage** frontend. Your plugin can add new interactive plots, tables, or static figures by registering them dynamically at runtime.

The idea is we register the figures the plugin makes via injection. The client imports a bundled up version of the plugin that exposes a function that takes a registry and the base classes (Figure, Plot, Table, etc.). When the plugin is loaded, this function is executed, which registers the new figures for use in the client.

---

## Prerequisites

* Basic understanding of **Plotly.js** (optional but helpful).
* Node.js and npm/yarn installed.
* Your plugin will be built using **Rollup** and Babel to compile modern React code.

---

## Project Structure

A typical plugin repository has this structure:

```
.
├── figures/                # Your figure component factories (JSX files)
│   ├── MyCustomPlot.jsx
│   └── MyCustomTable.jsx
├── dist/                   # Compiled bundles (auto-generated)
├── .babelrc                
├── index.js                # Plugin registration entrypoint
├── package.json
├── rollup.config.mjs       # Build config using Rollup + Babel
└── README.md               
```

---

## Step 0: Install Prerequisites and Setup Your Plugin Project

---

### 0.1 Install Prerequisites

Make sure you have **Node.js** and **npm** installed:

```bash
node -v
npm -v
```

If missing, download from [nodejs.org](https://nodejs.org/).

---

### 0.2 Initialize Your Plugin Project

You can either:

* **Option A:** Create a new folder and initialize npm:

  ```bash
  mkdir my-figure-plugin
  cd my-figure-plugin
  npm init -y
  ```

* **Option B (Recommended):** Clone the example plugin repo and remove its git history to start fresh:

  ```bash
  git clone https://github.com/jaca230/DQM_webpage_nalu_plots_plugin.git my-figure-plugin
  cd my-figure-plugin
  rm -rf .git
  npm install
  ```

This gives you a working example with build configs and code you can modify.

---

### 0.3 Install Dependencies

Install React and build tooling dependencies:

```bash
npm install react react-dom
npm install --save-dev @babel/core @babel/preset-env @babel/preset-react \
  @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-babel \
  rollup
```

---

### 0.4 Create `.babelrc`

Create a `.babelrc` file:

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}
```

---

### 0.5 Create `rollup.config.mjs`

Add this Rollup config (adjust file names as needed):

```js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

const plugins = [
  resolve(),
  commonjs(),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
  }),
];

export default [
  {
    input: 'index.js',
    output: {
      file: 'dist/my-plugin.iife.js',
      format: 'iife',
      name: 'PluginRegister', // IMPORTANT NOTE: You MUST set this as the name for eval based plugin loading.
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    },
    external: ['react', 'react-dom'],
    plugins,
  },
  {
    input: 'index.js',
    output: {
      file: 'dist/my-plugin.es.js',
      format: 'es',
    },
    external: ['react', 'react-dom'],
    plugins,
  },
];
```

---

### 0.6 Add Build Script

In your `package.json` add:

```json
"scripts": {
  "build": "rollup -c"
}
```

Run build via:

```bash
npm run build
```

Now you're all set up to code!

---


## Step 1: Define Your Figures as Factory Functions

Your plugin figures are React components created inside factory functions. This lets us inject **base classes** and utilities at runtime, ensuring compatibility.

Example: `figures/MyCustomPlot.jsx`

```jsx
export default function makeMyCustomPlot({ Plot, SettingTypes }) {
  return class MyCustomPlot extends Plot {
    static displayName = 'My Custom Plot';
    static name = 'MyCustomPlot';

    // Define settings schema for your figure
    static get settingSchema() {
      return {
        ...super.settingSchema,
        dataUrl: {
          type: SettingTypes.STRING,
          default: 'http://localhost/api/default_data',
          label: 'Data URL',
          onChange: 'onUpdateTick',
        },
        customOption: {
          type: SettingTypes.INT,
          default: 10,
          label: 'Custom Option',
        },
      };
    }

    // Initialize your plot with JSON data
    initPlot(json) {
      return {
        data: [
          {
            x: json.timestamps,
            y: json.values,
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: 'blue' },
          },
        ],
        layout: {
          autosize: true,
          margin: { t: 30, r: 20, l: 40, b: 40 },
          xaxis: { title: 'Time' },
          yaxis: { title: 'Value' },
        },
      };
    }

    // Update plot with new data periodically
    updatePlot(json) {
      // Use same format as initPlot or update only data if layout unchanged
      return this.initPlot(json);
    }
  };
}
```

---

## Step 2: Register Your Figures

In your plugin's `index.js`, define a registration function that receives:

* `registry` — the global figure registry where your figures must be registered.
* `baseClasses` — the base classes your figures extend from (e.g., Plot, Table).

Example:

```js
import makeMyCustomPlot from './figures/MyCustomPlot.jsx';
import makeMyCustomTable from './figures/MyCustomTable.jsx';

function registerFigures({ registry, baseClasses }) {
  const { Plot, SettingTypes, Table } = baseClasses;

  const MyCustomPlot = makeMyCustomPlot({ Plot, SettingTypes });
  const MyCustomTable = makeMyCustomTable({ Table, SettingTypes });

  registry.register(MyCustomPlot.name, MyCustomPlot);
  registry.register(MyCustomTable.name, MyCustomTable);
}

export default registerFigures;

// Expose globally for eval/script loading
if (typeof window !== 'undefined') {
  window.PluginRegister = registerFigures;
}
```

---

## Step 3: Build Your Plugin Bundle

Use Rollup + Babel to build your plugin into bundles usable by the main app.

Example `rollup.config.mjs`:

```js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

const plugins = [
  resolve(),
  commonjs(),
  babel({
    babelHelpers: 'bundled',
    presets: ['@babel/preset-env', '@babel/preset-react'],
    exclude: 'node_modules/**',
  }),
];

export default [
  {
    input: 'index.js',
    output: {
      file: 'dist/my-plugin.iife.js',
      format: 'iife',
      name: 'PluginRegister',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    },
    external: ['react', 'react-dom'],
    plugins,
  },
  {
    input: 'index.js',
    output: {
      file: 'dist/my-plugin.es.js',
      format: 'es',
    },
    external: ['react', 'react-dom'],
    plugins,
  },
];
```

Run your build with:

```bash
npm run build
```

---

## Step 4: Publish and Use Your Plugin

---

### 4.1 Publish Your Plugin on GitHub

1. Create a new repository on GitHub, e.g., `my-figure-plugin`.

2. Push your local plugin code:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/my-figure-plugin.git
git push -u origin main
```

---

### 4.2 Serve Your Plugin via CDN

Your plugin is accessible on public CDNs like **jsDelivr**:

* ES module bundle URL:

  ```
  https://cdn.jsdelivr.net/gh/yourusername/my-figure-plugin@main/dist/my-plugin.es.js
  ```

* IIFE bundle URL (for older environments/brute force cases):

  ```
  https://cdn.jsdelivr.net/gh/yourusername/my-figure-plugin@main/dist/my-plugin.iife.js
  ```

Use these URLs in the DQM Webpage frontend plugin loader to dynamically load your plugin.

---

### 4.3 Version Tagging (Optional)

For stable releases:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then use the tag in CDN URLs:

```
https://cdn.jsdelivr.net/gh/yourusername/my-figure-plugin@v1.0.0/dist/my-plugin.es.js
```

---

That’s the recommended workflow from setup through publishing and loading your custom figure plugin!


---

## Additional Tips

* **Data URLs**: Each figure has a default `dataUrl` setting which you can override in the UI.
* **Settings Schema**: Use the `SettingTypes` enum to define settings of type `INT`, `STRING`, `BOOLEAN`, etc. The UI will auto-generate controls based on these.
* **React Base Classes**: Extend `Plot` for dynamic plots, `Table` for tables, or `StaticFigure` for static visualizations.
* **Asynchronous Data**: Use `onInit` and `onUpdateTick` lifecycle methods inherited from base classes to fetch and update data.
* **Debugging**: Use console warnings in your factory functions to detect missing or malformed data.

---

## See an Example Plugin

Check out the fully working example:

👉 [DQM\_webpage\_nalu\_plots\_plugin](https://github.com/jaca230/DQM_webpage_nalu_plots_plugin)

It demonstrates multiple figures, settings, and live data integration.

---

## License

MIT License — see [LICENSE](LICENSE) file for details.

---
