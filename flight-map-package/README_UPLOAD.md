# Flight Map Upload Guide

This package adds a standalone flight trajectory page to your existing GitHub Pages repository.

## 1. Upload these files

Copy the files into the repository while preserving their folders:

```text
flight-map.html
assets/css/flight-map.css
assets/js/flights-data.js
assets/js/flight-map.js
```

Do not upload the `docs` folder unless you want to keep the implementation notes.

## 2. Add the homepage navigation link

Open `index.html`. Inside:

```html
<nav class="masthead-nav" id="mastheadNav" aria-label="Site sections">
```

add this line, preferably after `Experience`:

```html
<a href="flight-map.html" class="nav-link">Flight Map</a>
```

The same line is also included in `index-navigation-snippet.html`.

## 3. Add the remaining flights

Open `assets/js/flights-data.js` and append one object per flight inside `window.FLIGHT_DATA`.

Use this format:

```javascript
{
  date: "2026-07-05",
  airline: "海南航空",
  flightNumber: "HU6204",
  departureTime: "20:15",
  arrivalDate: "2026-07-06",
  arrivalTime: "00:40",
  distanceKm: 3261,
  from: {
    city: "乌鲁木齐",
    airport: "乌鲁木齐天山国际机场",
    code: "URC",
    lat: 43.9071,
    lng: 87.4742
  },
  to: {
    city: "长沙",
    airport: "长沙黄花国际机场",
    code: "CSX",
    lat: 28.1892,
    lng: 113.2196
  }
}
```

Separate objects with commas. Coordinates need to be entered only as part of each record; the map automatically deduplicates airports.

## 4. Important privacy note

Do **not** publish:

- ticket numbers;
- booking references;
- passport or ID information;
- phone numbers;
- payment information.

The public map needs only date, airline, flight number, airports, times, coordinates, and distance.

## 5. What the page does automatically

- draws all flights on one map;
- groups repeated directional routes;
- makes repeated routes thicker;
- sizes airport markers by visit count;
- calculates flights, airports, routes, and total distance;
- provides a year filter;
- displays individual flight details when a route is selected;
- adapts to mobile screens.

## 6. Test after uploading

Open:

```text
https://liangjielliu.github.io/flight-map.html
```

GitHub Pages may take a short time to publish a new commit. A map background requires internet access because Leaflet and OpenStreetMap tiles are loaded from public CDNs.
