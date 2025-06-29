# DQM Webpage Frontend

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)
[![Node.js Version](https://img.shields.io/badge/node-%3E=16.0.0-green)](https://nodejs.org/)
[![NPM Version](https://img.shields.io/badge/npm-%3E=8.0.0-orange)](https://www.npmjs.com/)

## Overview

This is a **React-based frontend application** designed for dynamic data quality monitoring (DQM) visualization. It supports flexible plugin loading, interactive figures, tabbed layouts, and a customizable dashboard interface.

The frontend interacts with backend services (such as FastAPI-based APIs and ZeroMQ streams) to fetch and display live data plots, tables, and figures.

---

## Features

* **Dynamic Plugin System**: Load, register, and manage visualization plugins at runtime.
* **Figure Management**: Supports multiple figure types including plots and tables with customizable settings.
* **Dashboard with Tabs**: Organize figures into multiple tabs with drag-resize capabilities.
* **Persistent Layout**: Save and restore dashboard layouts and plugin configurations via local storage.
* **Settings Menu**: Adjust global and figure-specific settings interactively.
* **Loading and Error Handling**: Visual feedback for plugin loading and data fetching statuses.

---

## Project Structure

```
frontend/
├── public/                 # Static files, HTML, icons, manifest
├── src/
│   ├── App.jsx             # Main React application entry
│   ├── index.js            # React DOM render bootstrap
│   ├── index.css           # Global styles
│   ├── figures/            # Figure components (plots, tables, static)
│   ├── managers/           # Managers for plugins, figures, tabs, storage
│   ├── plugin/             # Plugin loading and info management
│   ├── registries/         # Registries for figure types and factories
│   ├── services/           # Services such as PluginManagementService
│   ├── ui/                 # UI components including modals and dashboard
│   ├── enums/              # Enumerations (e.g., SettingTypes)
│   ├── factories/          # Factories to create figure components
│   └── resources/          # Default JSON configs for layout and plugins
├── package.json            # NPM dependencies and scripts
├── package-lock.json       # Exact dependency versions
└── README.md               # This file
```

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

## License

MIT License — see [LICENSE](LICENSE) file for details.

---
