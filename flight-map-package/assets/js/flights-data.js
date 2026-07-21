/**
 * Public flight records used by flight-map.html.
 *
 * Privacy: do NOT add ticket numbers, booking references, passport details,
 * phone numbers, or other private order information to this public file.
 *
 * Add one object for each flight. Coordinates are decimal degrees.
 */
window.FLIGHT_DATA = [
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
  },
  {
    date: "2026-06-23",
    airline: "祥鹏航空",
    flightNumber: "8L9567",
    departureTime: "23:00",
    arrivalDate: "2026-06-24",
    arrivalTime: "01:50",
    distanceKm: 1758,
    from: {
      city: "兰州",
      airport: "兰州中川国际机场",
      code: "LHW",
      lat: 36.5152,
      lng: 103.6208
    },
    to: {
      city: "乌鲁木齐",
      airport: "乌鲁木齐天山国际机场",
      code: "URC",
      lat: 43.9071,
      lng: 87.4742
    }
  }
];
