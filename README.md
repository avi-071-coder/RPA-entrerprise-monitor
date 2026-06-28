# RPA Enterprise Monitor 2026

A high-performance, real-time telemetry dashboard designed for monitoring large-scale enterprise RPA (Robotic Process Automation) deployments. Built specifically for the Frontend Battle 2026 Hackathon.

## General Idea & Value Proposition
Modern enterprises deploy thousands of RPA bots across various departments, but tracking their financial impact (savings, ROI) and operational status in real-time is challenging. 

This dashboard solves that by ingesting a massive stream of 50,000 project records, applying real-time data mutations (anomalies, savings growth), and visualizing the metrics instantly without frame drops or browser crashes. It serves as the ultimate mission-control center for C-suite executives and IT infrastructure teams.

## Architecture & Technical Highlights
- **Custom Virtual DOM Grid**: The core grid engine recycles a maximum of 30 DOM nodes to seamlessly render 50,000 streaming rows at 60 FPS, maintaining O(1) memory complexity relative to row count. No external virtualization libraries are used.
- **High-Frequency Stream Engine**: Data batches arrive every 200ms. A central `useReducer` state engine merges updates into a master `Map` in O(1) time. The UI view derives from this state asynchronously, preventing blocking the main thread.
- **On-Demand Analytics Engine**: Integrates Chart.js for data visualization, strictly isolating chart rendering to "Paused" states to guarantee zero frame drops during live high-frequency data ingestion.

## Core Features
1. **Real-time KPI Engine**: Tracks total rows processed, cumulative savings ($USD), and active robots deployed with upward trend indicators and custom graph-paper grid textures.
2. **Alert Flash System**: Instantly highlights "Failed" projects or projects experiencing a negative ROI anomaly with a transient red flash.
3. **Interactive Analytics Overlay**: When the data pipeline is paused, toggle an advanced Chart.js dashboard to visualize Project Status distributions, Top Industry Savings, and Department ROI breakdowns using frozen data snapshots.
4. **Fuzzy Search Engine**: Instantly filters 50,000 rows across Project Name, ID, Partner, and Country with a sleek inline clear action.
5. **Categorical Filtering**: Multi-select dropdowns for quick segmentation by Department, Industry, Automation Type, and Status.
6. **Pipeline Control**: Pause the live stream to inspect data while the underlying buffer continues to queue incoming anomalies.
7. **Detailed Project Inspector Drawer**: Deep-dive into a project's metrics when paused, showing a calculated project duration in months, and prominent financial highlights.

## Setup & Execution

1. Make sure Node.js is installed.
2. Clone this repository and navigate to the project directory:
   ```bash
   cd rpa-monitor
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

