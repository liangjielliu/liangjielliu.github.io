(() => {
  "use strict";

  const rawFlights = Array.isArray(window.FLIGHT_DATA) ? window.FLIGHT_DATA : [];
  const requiredIds = [
    "flightMap", "yearFilter", "flightCount", "airportCount", "routeCount",
    "distanceCount", "routeDetail", "routeList", "visibleRouteCount"
  ];

  const elements = Object.fromEntries(requiredIds.map((id) => [id, document.getElementById(id)]));
  const missingElement = requiredIds.find((id) => !elements[id]);
  if (missingElement) {
    console.error(`Flight map cannot start: missing #${missingElement}.`);
    return;
  }

  if (typeof L === "undefined") {
    showFatalError("The map library could not be loaded. Please check your internet connection.");
    return;
  }

  const flights = rawFlights
    .map(normalizeFlight)
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (flights.length === 0) {
    showFatalError("No valid flight records were found in assets/js/flights-data.js.");
    return;
  }

  const map = L.map(elements.flightMap, {
    zoomControl: true,
    minZoom: 2,
    worldCopyJump: true
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const routeLayer = L.layerGroup().addTo(map);
  const airportLayer = L.layerGroup().addTo(map);
  const routeLayers = new Map();
  let selectedRouteKey = null;

  populateYearFilter();
  render("all");
  elements.yearFilter.addEventListener("change", () => render(elements.yearFilter.value));

  function normalizeFlight(item, index) {
    if (!item || !item.from || !item.to) {
      console.warn(`Skipped flight ${index + 1}: missing endpoint.`);
      return null;
    }

    const date = String(item.date || "");
    const distanceKm = Number(item.distanceKm);
    const from = normalizeAirport(item.from);
    const to = normalizeAirport(item.to);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(distanceKm) || !from || !to) {
      console.warn(`Skipped flight ${index + 1}: invalid date, distance, or coordinates.`);
      return null;
    }

    return {
      date,
      year: date.slice(0, 4),
      airline: String(item.airline || "Unknown airline"),
      flightNumber: String(item.flightNumber || "—"),
      departureTime: String(item.departureTime || "—"),
      arrivalDate: String(item.arrivalDate || date),
      arrivalTime: String(item.arrivalTime || "—"),
      distanceKm,
      from,
      to
    };
  }

  function normalizeAirport(airport) {
    const lat = Number(airport.lat);
    const lng = Number(airport.lng);
    const code = String(airport.code || "").trim().toUpperCase();
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !code) return null;
    return {
      city: String(airport.city || code),
      airport: String(airport.airport || code),
      code,
      lat,
      lng
    };
  }

  function populateYearFilter() {
    const years = [...new Set(flights.map((flight) => flight.year))].sort((a, b) => b.localeCompare(a));
    years.forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      elements.yearFilter.appendChild(option);
    });
  }

  function render(year) {
    const visibleFlights = year === "all" ? flights : flights.filter((flight) => flight.year === year);
    const routes = aggregateRoutes(visibleFlights);
    const airports = aggregateAirports(visibleFlights);

    selectedRouteKey = null;
    routeLayer.clearLayers();
    airportLayer.clearLayers();
    routeLayers.clear();

    updateStats(visibleFlights, routes, airports);
    drawRoutes(routes);
    drawAirports(airports);
    renderRouteList(routes);
    resetDetail();
    fitVisibleBounds(airports);
  }

  function aggregateRoutes(items) {
    const grouped = new Map();
    items.forEach((flight) => {
      const key = `${flight.from.code}-${flight.to.code}`;
      if (!grouped.has(key)) {
        grouped.set(key, { key, from: flight.from, to: flight.to, flights: [], distanceKm: 0 });
      }
      const route = grouped.get(key);
      route.flights.push(flight);
      route.distanceKm += flight.distanceKm;
    });
    return [...grouped.values()].sort((a, b) => b.flights.length - a.flights.length || b.flights[0].date.localeCompare(a.flights[0].date));
  }

  function aggregateAirports(items) {
    const grouped = new Map();
    items.forEach((flight) => {
      [flight.from, flight.to].forEach((airport) => {
        if (!grouped.has(airport.code)) grouped.set(airport.code, { ...airport, visits: 0 });
        grouped.get(airport.code).visits += 1;
      });
    });
    return [...grouped.values()];
  }

  function updateStats(items, routes, airports) {
    const distance = items.reduce((sum, flight) => sum + flight.distanceKm, 0);
    elements.flightCount.textContent = formatNumber(items.length);
    elements.airportCount.textContent = formatNumber(airports.length);
    elements.routeCount.textContent = formatNumber(routes.length);
    elements.distanceCount.textContent = `${formatNumber(distance)} km`;
    elements.visibleRouteCount.textContent = routes.length;
  }

  function drawRoutes(routes) {
    routes.forEach((route, index) => {
      const curve = createCurve(route.from, route.to, index, route.flights.length);
      curve.on("mouseover", () => setRouteStyle(route.key, true));
      curve.on("mouseout", () => setRouteStyle(route.key, route.key === selectedRouteKey));
      curve.on("click", () => selectRoute(route));
      curve.addTo(routeLayer);
      routeLayers.set(route.key, curve);
    });
  }

  function createCurve(from, to, index, count) {
    const start = L.latLng(from.lat, from.lng);
    const end = L.latLng(to.lat, to.lng);
    const midpoint = L.latLng((start.lat + end.lat) / 2, (start.lng + end.lng) / 2);
    const dx = end.lng - start.lng;
    const dy = end.lat - start.lat;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;
    const direction = index % 2 === 0 ? 1 : -1;
    const bend = Math.min(10, Math.max(1.5, length * 0.16)) * direction;
    const control = L.latLng(midpoint.lat + (dx / length) * bend, midpoint.lng - (dy / length) * bend);
    const points = quadraticBezier(start, control, end, 42);

    const baseWeight = Math.min(8, 1.7 + Math.sqrt(count) * 1.25);
    return L.polyline(points, {
      color: "#2f6f9f",
      weight: baseWeight,
      baseWeight,
      opacity: 0.46,
      smoothFactor: 1,
      lineCap: "round",
      lineJoin: "round",
      className: "flight-route"
    });
  }

  function quadraticBezier(start, control, end, segments) {
    const points = [];
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const mt = 1 - t;
      points.push([
        mt * mt * start.lat + 2 * mt * t * control.lat + t * t * end.lat,
        mt * mt * start.lng + 2 * mt * t * control.lng + t * t * end.lng
      ]);
    }
    return points;
  }

  function drawAirports(airports) {
    const maxVisits = Math.max(...airports.map((airport) => airport.visits));
    airports.forEach((airport) => {
      const size = 10 + Math.round((airport.visits / maxVisits) * 9);
      const icon = L.divIcon({
        className: "airport-marker",
        html: `<span style="--marker-size:${size}px"></span>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });
      const marker = L.marker([airport.lat, airport.lng], { icon, keyboard: true });
      marker.bindPopup(`<div class="popup-title">${escapeHtml(airport.city)} (${escapeHtml(airport.code)})</div><div class="popup-subtitle">${escapeHtml(airport.airport)} · ${airport.visits} visit${airport.visits === 1 ? "" : "s"}</div>`);
      marker.addTo(airportLayer);
    });
  }

  function renderRouteList(routes) {
    elements.routeList.replaceChildren();
    if (routes.length === 0) {
      elements.routeList.innerHTML = '<div class="empty-state">No routes match this filter.</div>';
      return;
    }

    routes.forEach((route) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "route-button";
      button.dataset.routeKey = route.key;
      button.innerHTML = `
        <span>
          <span class="route-code">${escapeHtml(route.from.code)} → ${escapeHtml(route.to.code)}</span>
          <span class="route-cities">${escapeHtml(route.from.city)} to ${escapeHtml(route.to.city)}</span>
        </span>
        <span class="route-badge">${route.flights.length} flight${route.flights.length === 1 ? "" : "s"}</span>
      `;
      button.addEventListener("click", () => selectRoute(route));
      elements.routeList.appendChild(button);
    });
  }

  function selectRoute(route) {
    if (selectedRouteKey) setRouteStyle(selectedRouteKey, false);
    selectedRouteKey = route.key;
    setRouteStyle(route.key, true);

    document.querySelectorAll(".route-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.routeKey === route.key);
    });

    const history = route.flights.map((flight) => `
      <div class="flight-row">
        <div class="flight-title">${escapeHtml(flight.flightNumber)} · ${escapeHtml(flight.airline)}</div>
        <div class="flight-meta">${formatDate(flight.date)} ${escapeHtml(flight.departureTime)} → ${formatDate(flight.arrivalDate)} ${escapeHtml(flight.arrivalTime)} · ${formatNumber(flight.distanceKm)} km</div>
      </div>
    `).join("");

    elements.routeDetail.innerHTML = `
      <h2>${escapeHtml(route.from.city)} to ${escapeHtml(route.to.city)}</h2>
      <div class="detail-route">
        <span class="airport-code">${escapeHtml(route.from.code)}</span>
        <span class="route-arrow"></span>
        <span class="airport-code">${escapeHtml(route.to.code)}</span>
      </div>
      <div class="detail-summary">
        <div class="detail-chip"><strong>${route.flights.length}</strong><span>Flights</span></div>
        <div class="detail-chip"><strong>${formatNumber(route.distanceKm)} km</strong><span>Total distance</span></div>
      </div>
      <div class="flight-history">${history}</div>
    `;

    const layer = routeLayers.get(route.key);
    if (layer) map.fitBounds(layer.getBounds(), { padding: [70, 70], maxZoom: 6 });
  }

  function setRouteStyle(key, highlighted) {
    const layer = routeLayers.get(key);
    if (!layer) return;
    layer.setStyle({
      color: highlighted ? "#d46b32" : "#2f6f9f",
      opacity: highlighted ? 0.95 : 0.46,
      weight: highlighted ? layer.options.baseWeight + 1.5 : layer.options.baseWeight
    });
    if (highlighted) layer.bringToFront();
  }

  function resetDetail() {
    elements.routeDetail.innerHTML = "<h2>Choose a route</h2><p>Click a curved line on the map or select an item from the route list.</p>";
    document.querySelectorAll(".route-button").forEach((button) => button.classList.remove("active"));
  }

  function fitVisibleBounds(airports) {
    if (airports.length === 1) {
      map.setView([airports[0].lat, airports[0].lng], 5);
      return;
    }
    const bounds = L.latLngBounds(airports.map((airport) => [airport.lat, airport.lng]));
    map.fitBounds(bounds, { padding: [45, 45], maxZoom: 5 });
  }

  function showFatalError(message) {
    const banner = document.createElement("div");
    banner.className = "error-banner";
    banner.textContent = message;
    elements.flightMap.before(banner);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  function formatDate(value) {
    const [year, month, day] = value.split("-");
    return year && month && day ? `${year}-${month}-${day}` : value;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
