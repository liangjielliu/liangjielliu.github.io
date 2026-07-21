# Flight Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone interactive flight trajectory page to the existing static GitHub Pages academic homepage.

**Architecture:** Use Leaflet from a CDN for the map, a plain JavaScript data file for flight records, and a separate rendering script that aggregates routes, airports, years, and statistics. Keep the page independent of the existing homepage CSS so it can be uploaded without restructuring the repository.

**Tech Stack:** HTML5, CSS3, JavaScript ES6, Leaflet 1.9.4, OpenStreetMap tiles.

## Global Constraints

- No npm, bundler, server, or framework.
- Must work on GitHub Pages.
- Ticket numbers and ticket status are excluded from public data.
- All user-editable flight records live in `assets/js/flights-data.js`.
- The page must remain usable on phones.

---

### Task 1: Flight data and schema

**Files:**
- Create: `assets/js/flights-data.js`

**Interfaces:**
- Produces: global `window.FLIGHT_DATA` array with normalized flight objects.

- [ ] Define the flight schema and add the two supplied sample records.
- [ ] Include airport coordinates and IATA codes in each endpoint.
- [ ] Verify JavaScript syntax with `node --check assets/js/flights-data.js`.

### Task 2: Standalone page and visual layout

**Files:**
- Create: `flight-map.html`
- Create: `assets/css/flight-map.css`

**Interfaces:**
- Consumes: `window.FLIGHT_DATA`, Leaflet CDN assets.
- Produces: map container, filter controls, summary cards, route list, and detail panel.

- [ ] Build semantic HTML for the page.
- [ ] Match the existing academic homepage's Source Sans typography and blue accent.
- [ ] Add responsive rules for tablet and mobile widths.
- [ ] Validate required element IDs with an HTML parser.

### Task 3: Map rendering and interaction

**Files:**
- Create: `assets/js/flight-map.js`

**Interfaces:**
- Consumes: `window.FLIGHT_DATA`.
- Produces: Leaflet layers, year filters, aggregated routes, statistics, and detail content.

- [ ] Normalize and validate records at startup.
- [ ] Aggregate repeated directional routes while retaining underlying flight records.
- [ ] Draw curved SVG routes with line thickness based on flight count.
- [ ] Draw airport markers sized by visit count.
- [ ] Add year filtering and map bounds updates.
- [ ] Add route hover highlighting and click details.
- [ ] Verify JavaScript syntax with `node --check assets/js/flight-map.js`.

### Task 4: Upload documentation

**Files:**
- Create: `README_UPLOAD.md`
- Create: `index-navigation-snippet.html`

**Interfaces:**
- Produces: exact GitHub upload instructions and a navigation-link snippet.

- [ ] Explain which files to upload and where.
- [ ] Explain how to append all remaining records.
- [ ] Include privacy warning not to publish ticket numbers.
- [ ] Package all files into `flight-map-package.zip`.
