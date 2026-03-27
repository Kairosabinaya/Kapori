# KAPORI Dashboard

KAPORI (Kecerdasan Artifisial untuk Pertanian Organik Indonesia) is an interactive smart agriculture dashboard prototype built for the Inovasi Muda competition. The application simulates a production-grade IoT farm management system with real-time sensor monitoring, AI-driven recommendations, and multi-farm filtering capabilities.

> **Note:** This is a high-fidelity prototype with hardcoded mock data designed to demonstrate the full user experience. No backend or live sensor connections are required.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Pages](#pages)
- [Architecture](#architecture)
- [Filter System](#filter-system)
- [Customization](#customization)
- [Build for Production](#build-for-production)

---

## Tech Stack

| Category        | Technology                        |
| --------------- | --------------------------------- |
| Framework       | React 19 + Vite 8                 |
| Styling         | Tailwind CSS 3.4                  |
| Animations      | Framer Motion 12                  |
| Routing         | React Router DOM 7                |
| Charts          | Recharts 3.8                      |
| Icons           | Lucide React                      |
| Notifications   | React Hot Toast                   |
| Utilities       | clsx                              |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

```bash
git clone https://github.com/Kairosabinaya/Kapori.git
cd Kapori
npm install
```

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`.

---

## Project Structure

```
kapori-dashboard/
├── public/
│   ├── favicon.png              # Application favicon (hero.png)
│   └── icons.svg                # SVG icon sprite
├── src/
│   ├── assets/
│   │   ├── hero.png             # Hero image / favicon source
│   │   └── logo.png             # KAPORI brand logo
│   ├── components/
│   │   ├── charts/
│   │   │   └── FieldPerformanceChart.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx       # Top bar with filters, search, notifications
│   │   │   ├── Layout.jsx       # Root layout with sidebar + outlet context
│   │   │   └── Sidebar.jsx      # Collapsible navigation sidebar
│   │   └── ui/
│   │       ├── KaporiLogo.jsx   # Brand logo component
│   │       ├── MetricCard.jsx   # Reusable metric display card
│   │       ├── Modal.jsx        # Reusable modal dialog
│   │       ├── ProgressBar.jsx  # Horizontal progress bar
│   │       └── StatusDot.jsx    # Online/offline/warning status indicator
│   ├── data/
│   │   └── index.js             # All mock data and filter functions
│   ├── pages/
│   │   ├── Overview.jsx         # Main dashboard with metrics and AI insights
│   │   ├── Inteligensi.jsx      # AI recommendations and risk assessment
│   │   ├── Lahan.jsx            # Interactive SVG farm map
│   │   ├── Perangkat.jsx        # IoT device management grid
│   │   ├── Peringatan.jsx       # Alert management system
│   │   ├── Laporan.jsx          # Report generation and document management
│   │   └── Pengaturan.jsx       # User settings and system configuration
│   ├── App.jsx                  # Root component with routing and global state
│   ├── main.jsx                 # Application entry point
│   └── index.css                # Global styles and Tailwind directives
├── index.html                   # HTML entry point
├── tailwind.config.js           # Tailwind configuration with KAPORI color palette
├── vite.config.js               # Vite build configuration
└── package.json
```

---

## Pages

### Overview (`/overview`)

The main dashboard view displaying aggregate sensor metrics across all active farms. Includes an AI Insight card that detects anomalies (e.g., water stress predictions) with actionable recommendations. Metric cards are clickable and open a modal showing per-lahan breakdown. The performance chart at the bottom adapts its data range and values based on the active farm and time filters.

### Inteligensi (`/inteligensi`)

AI-powered intelligence page with three sections:
- **Active Recommendations** -- Suggested actions with confidence scores that can be applied or dismissed.
- **Detected Risks** -- Critical and warning-level risk cards with detail modals.
- **Decision History** -- Timeline of past actions taken and their outcomes.

### Lahan (`/lahan`)

An interactive SVG map representing three farm zones (Lahan A, B, C). Clicking a zone opens a slide-in detail panel with live sensor metrics (humidity, temperature, pH, conductivity, NPK index, system health), progress bars, and action buttons (start irrigation, export data, refresh sensors). Non-selected farm zones are dimmed when a specific farm filter is active.

### Perangkat (`/perangkat`)

IoT device management grid showing all registered sensors, relays, and controllers. Each device card displays signal strength, battery level, solar charge, error banners, and last report time. Supports adding new devices via a modal form, restarting devices, viewing diagnostic details with signal history charts, and removing devices. The grid filters by the selected farm.

### Peringatan (`/peringatan`)

Alert management system with category tabs (All, Critical, Warning, Info), a search bar for filtering alerts by keyword, and bulk acknowledge functionality. Each alert card is clickable for a detail modal. Alerts can be individually acknowledged or deleted. The alert count in the sidebar badge and header notification panel updates based on the active farm filter.

### Laporan (`/laporan`)

Split-panel layout with a report creation form on the left (report type, lahan, date range, format selection) and a document list on the right. Supports creating new reports with a loading state, downloading documents with per-file state tracking, previewing report metadata, and deleting reports with a confirmation dialog. The document list filters by the selected farm.

### Pengaturan (`/pengaturan`)

User settings page with four sections:
- **Account Profile** -- Editable name, email, phone, and role via a modal form.
- **Notification Preferences** -- Toggle switches for email alerts, weather warnings, weekly reports, and firmware updates. Each toggle provides toast feedback.
- **Alert Thresholds** -- Range sliders for humidity, pH, and temperature limits with an inline save button.
- **Display** -- Dark mode toggle (visual feedback only).

---

## Architecture

### State Management

Global state is managed at the `App.jsx` level and distributed through two mechanisms:

1. **Props** -- `acknowledgedAlerts` and filter state are passed directly to `Layout`, which forwards them to `Header` and `Sidebar`.
2. **Outlet Context** -- The `filters` object (`selectedFarm`, `selectedTime`) is passed to all page components via React Router's `useOutletContext()` hook.

### Data Layer

All mock data and filter logic is centralized in `src/data/index.js`. The module exports:

- **Raw data arrays** -- `lahans`, `perangkats`, `alertsData`, `rekomendasis`, `risks`, `decisionHistory`, `reportsData`
- **Filter functions** -- `getFilteredLahans()`, `getFilteredPerangkats()`, `getFilteredAlerts()`, `getFilteredRekomendasis()`, `getFilteredRisks()`, `getFilteredDecisionHistory()`, `getFilteredReports()`
- **Computed metrics** -- `getOverviewMetrics()` returns averaged sensor values across filtered lahans
- **Chart generator** -- `generateChartData()` produces different time-series data per farm and time combination

### Farm-to-Lahan Mapping

| Farm Filter   | Mapped Lahan(s)            |
| ------------- | -------------------------- |
| Semua Farm    | Lahan A, Lahan B, Lahan C  |
| Farm Utama    | Lahan A                    |
| Farm Selatan  | Lahan B                    |
| Farm Barat    | Lahan C                    |

---

## Filter System

The dashboard header contains two global filter dropdowns:

- **Farm Filter** -- Selects which farm's data to display. Affects all pages simultaneously: metrics, device lists, alerts, recommendations, map highlighting, and report documents.
- **Time Filter** -- Selects the analysis period (Hari Ini, 7 Hari Terakhir, 30 Hari Terakhir, Bulan Ini, Kustom). Affects metric values via time-based multipliers and changes the chart data range (24 hourly points vs. 7 or 30 daily points).

Data variation across filters is achieved using a deterministic hash function, ensuring the same filter combination always produces the same values while different combinations produce visibly different data.

---

## Customization

### Color Palette

The KAPORI color palette is defined in `tailwind.config.js` under `theme.extend.colors.kapori`. The primary green palette ranges from `kapori-50` (lightest) to `kapori-900` (darkest), with `kapori-600` (`#2D6A4F`) as the primary brand color.

### Logo

Replace `src/assets/logo.png` with your own logo file. The `KaporiLogo` component will automatically use it.

### Mock Data

To connect to a real backend, replace the hardcoded arrays and filter functions in `src/data/index.js` with API calls using `fetch` or a library like `axios`. The filter functions already accept farm and time parameters, so the API integration would follow the same interface.

---

## Build for Production

```bash
npm run build
```

The production bundle will be output to the `dist/` directory. To preview the production build locally:

```bash
npm run preview
```

---

## License

This project was built for the Inovasi Muda competition. All rights reserved.
