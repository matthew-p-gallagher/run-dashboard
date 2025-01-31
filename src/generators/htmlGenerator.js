class HTMLGenerator {
  static generateSingleRouteAnalysis(route) {
    const stats = route.calculateStats();
    const coordinates = route.getCoordinates();
    const elevationData = route.getElevationData();
    const heartRateData = route.getHeartRateData();

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Run Analysis - ${route.name}</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js"></script>
    <style>
        body { 
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 20px;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
            color: #343a40;
        }
        .header {
            margin-bottom: 30px;
        }
        .run-title {
            color: #2c3e50;
            margin: 0;
            font-size: 2.5em;
            font-weight: 600;
        }
        .run-date {
            color: #6c757d;
            font-size: 1.1em;
            margin-top: 5px;
        }
        #map { 
            height: 500px; 
            margin-bottom: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stats { 
            margin: 20px 0;
            padding: 20px;
            background: #ffffff;
            border-radius: 12px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-item {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            transition: transform 0.2s;
        }
        .stat-item:hover {
            transform: translateY(-2px);
        }
        .stat-value {
            font-size: 28px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
        }
        .stat-label {
            color: #6c757d;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .charts {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .chart-container {
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="run-title">${route.name}</h1>
        <div class="run-date">${route.getFormattedDate()} at ${route.getFormattedStartTime()}</div>
    </div>
    <div id="map"></div>
    <div class="stats">
        <div class="stat-item">
            <div class="stat-value">${stats.totalDistanceKm.toFixed(2)} km</div>
            <div class="stat-label">Distance</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.formattedDuration}</div>
            <div class="stat-label">Duration</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.formattedPace}</div>
            <div class="stat-label">Average Pace</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.elevationGainM.toFixed(0)} m</div>
            <div class="stat-label">Elevation Gain</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.avgHeartRate} bpm</div>
            <div class="stat-label">Average Heart Rate</div>
        </div>
    </div>
    <div class="charts">
        <div class="chart-container">
            <canvas id="elevationChart"></canvas>
        </div>
        <div class="chart-container">
            <canvas id="heartRateChart"></canvas>
        </div>
    </div>
    <script>
        // Initialize map
        const map = L.map('map', {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([${coordinates[0][0]}, ${coordinates[0][1]}], 14);
        
        // Add map layer - CARTO Light theme
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Add route to map
        const routePoints = ${JSON.stringify(coordinates)};
        
        // Smooth points using moving average
        const smoothPoints = (() => {
            const windowSize = 5; // Size of the moving window
            const smoothed = [];
            
            for (let i = 0; i < routePoints.length; i++) {
                let windowStart = Math.max(0, i - Math.floor(windowSize / 2));
                let windowEnd = Math.min(routePoints.length, i + Math.floor(windowSize / 2));
                let lat = 0, lng = 0;
                let count = 0;
                
                for (let j = windowStart; j < windowEnd; j++) {
                    lat += routePoints[j][0];
                    lng += routePoints[j][1];
                    count++;
                }
                
                smoothed.push([lat / count, lng / count]);
            }
            return smoothed;
        })();

        L.polyline(smoothPoints, {
            color: '#FF4500',
            weight: 4,
            opacity: 0.8,
            smoothFactor: 1.5
        }).addTo(map);

        // Add start and end markers using original points for accuracy
        L.marker(routePoints[0], {
            title: 'Start'
        }).addTo(map);
        
        L.marker(routePoints[routePoints.length - 1], {
            title: 'End'
        }).addTo(map);

        // Fit bounds with padding
        const bounds = L.latLngBounds(routePoints);
        map.fitBounds(bounds, {
            padding: [50, 50]
        });

        // Create elevation chart
        const elevCtx = document.getElementById('elevationChart').getContext('2d');
        new Chart(elevCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify([...Array(elevationData.length).keys()])},
                datasets: [{
                    label: 'Elevation Profile',
                    data: ${JSON.stringify(elevationData)},
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Elevation Profile'
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Elevation (m)'
                        }
                    }
                }
            }
        });

        // Create heart rate chart
        const hrCtx = document.getElementById('heartRateChart').getContext('2d');
        new Chart(hrCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify([...Array(heartRateData.length).keys()])},
                datasets: [{
                    label: 'Heart Rate',
                    data: ${JSON.stringify(heartRateData)},
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1,
                    fill: true,
                    backgroundColor: 'rgba(255, 99, 132, 0.1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Heart Rate'
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Heart Rate (bpm)'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
  }

  static generateHeatmap(routes) {
    const centerPoint = routes[0].getCenterPoint();
    const allPoints = routes.flatMap((route) =>
      route.getCoordinates().map((coord) => [...coord, 0.5])
    );

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Running Heatmap</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        const map = L.map('map').setView([${centerPoint.latitude}, ${centerPoint.longitude}], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const points = ${JSON.stringify(allPoints)};

        L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 16,
            gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
        }).addTo(map);

        // Fit bounds
        const bounds = L.latLngBounds(points.map(p => [p[0], p[1]]));
        map.fitBounds(bounds);
    </script>
</body>
</html>`;
  }
}

module.exports = HTMLGenerator;
