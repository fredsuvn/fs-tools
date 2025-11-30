# FS-Tools

A collection of JavaScript tools for development, visualization, and utility functions.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Directory Structure](#directory-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Available Tools](#available-tools)
- [License](#license)

## Overview
FS-Tools is a lightweight JavaScript toolset designed to provide developers with various utilities for different development tasks. The collection currently includes visualization tools for JMH benchmarks and will be expanded with additional tools in the future.

## Features
- **Visualization Tools**: Interactive visualizations for performance data
- **Responsive Design**: Works across different screen sizes and devices
- **Lightweight**: Minimal dependencies for better performance
- **Extensible Architecture**: Easy to add new tools and functionality
- **Modern UI**: Clean, intuitive user interface

## Directory Structure

```
fs-tools/
├── docs/                 # Documentation and resources
│   └── pics/            # Images and graphical assets
│       └── logo.svg      # Project logo
├── tools/                # Collection of tools
│   ├── jmh/              # JMH Visualizer tool
│   │   ├── jmh-visualizer.css
│   │   ├── jmh-visualizer.html
│   │   ├── jmh-visualizer.js
│   │   ├── jmh.txt
│   │   └── results.json
│   └── js/               # Shared JavaScript libraries
│       ├── echarts.min.js
│       ├── fs-tools.js
│       ├── jquery-3.7.1.min.js
│       ├── jquery-ui.min.css
│       └── jquery-ui.min.js
├── index.html            # Project homepage
├── LICENSE               # License file
└── README.md             # Project documentation (this file)
```

## Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```

2. Navigate to the project directory:
   ```bash
   cd fs-tools
   ```

3. Open the `index.html` file in your preferred web browser to access the tool collection.

No additional installation steps are required as all dependencies are included in the project.

## Usage

1. **Accessing the Tool Collection**:
   - Open `index.html` in a web browser
   - Browse available tools in the collection
   - Click on a tool card to access specific functionality

2. **Running Individual Tools**:
   - Each tool can be accessed directly through its HTML file
   - For example, to use the JMH Visualizer:
     ```
     open tools/jmh/jmh-visualizer.html
     ```

3. **Using the JMH Visualizer**:
   - The visualizer will load default benchmark data from `results.json`
   - You can upload your own JSON benchmark results using the file upload feature
   - Use the global controls to adjust chart types, rendering methods, and sorting options
   - Toggle groups to expand or collapse benchmark categories

## Available Tools

### 1. JMH Benchmark Visualizer

A powerful visualization tool for Java Microbenchmark Harness (JMH) performance test results:

- **Features**:
  - Interactive charts with ECharts
  - Support for horizontal and vertical bar charts
  - Canvas and SVG rendering options
  - Multiple sorting criteria (Score, Throughput)
  - Group-based organization of benchmarks
  - Environment information display
  - File upload support for custom benchmark results

- **Usage**:
  1. Open the tool through the main page or directly
  2. Upload your JMH results JSON file or use the default data
  3. Use the controls to customize your view
  4. Expand/collapse groups to focus on specific benchmarks
  5. Copy SVG of charts for documentation purposes

### 2. Upcoming Tools

The following tools are planned for future releases:

- **Code Formatter**: Format code in multiple programming languages
- **Documentation Generator**: Generate documentation from code comments

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

TRAE & DeepSeek-V3.1/Doubal-Seed-Code