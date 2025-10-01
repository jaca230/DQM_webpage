# DQM Webpage Frontend

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)
[![Node.js Version](https://img.shields.io/badge/node-%3E=16.0.0-green)](https://nodejs.org/)
[![NPM Version](https://img.shields.io/badge/npm-%3E=8.0.0-orange)](https://www.npmjs.com/)

## Overview

The **DQM Webpage Frontend** is a React-based dashboard for **dynamic data quality monitoring (DQM)**.
It supports plugin-based figures (plots, tables, labels, etc.), tabbed layouts, and persistent configurations.

The frontend connects to backend APIs (e.g. [ZMQSUB-to-FastAPI](https://github.com/jaca230/ZMQSUB_to_FastAPI)) to display live experiment data.

---

## Quick Start

```bash
# Clone repo
git clone https://github.com/jaca230/DQM_webpage.git
cd DQM_webpage/frontend

# Install dependencies
npm install

# Run development server
npm start
```

By default, the app runs at [http://localhost:3000](http://localhost:3000).

For production builds:

```bash
npm run build
```

---

## Documentation

Full documentation, including:

* **Installation & Deployment**
* **Dashboard Layout**
* **Figures**
* **Plugin System**
* **UI Tutorial**

See the [Wiki](https://github.com/jaca230/DQM_webpage/wiki)

---

## License

MIT License — see [LICENSE](LICENSE).

---
