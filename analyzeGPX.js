const fs = require("fs");
const path = require("path");
const Run = require("./src/models/Run");
const GPXParser = require("./src/utils/gpxParser");
const HTMLGenerator = require("./src/generators/htmlGenerator");
const OutputManager = require("./src/utils/outputManager");

class RouteAnalyzer {
  constructor(directoryPath) {
    this.directoryPath = directoryPath;
    this.routes = [];
    this.outputManager = new OutputManager();
  }

  loadRoutes(selectedIndex = null) {
    const files = fs.readdirSync(this.directoryPath).filter((file) => file.endsWith(".gpx"));
    console.log(`Found ${files.length} GPX files`);

    if (selectedIndex !== null) {
      // Only load the selected file
      if (selectedIndex >= 0 && selectedIndex < files.length) {
        const file = files[selectedIndex];
        const filePath = path.join(this.directoryPath, file);
        const points = GPXParser.readGPXFile(filePath);
        if (points) {
          this.routes = [new Run(path.basename(file, ".gpx"), points)];
        }
      }
    } else {
      // Load all files (for listing)
      files.forEach((file) => {
        const filePath = path.join(this.directoryPath, file);
        const points = GPXParser.readGPXFile(filePath, false); // false = don't log details
        if (points) {
          this.routes.push(new Run(path.basename(file, ".gpx"), points));
        }
      });
    }
  }

  generateSingleRouteAnalysis(routeIndex) {
    if (routeIndex >= this.routes.length) {
      console.log("Invalid route index");
      return;
    }

    const route = this.routes[routeIndex];
    const html = HTMLGenerator.generateSingleRouteAnalysis(route);
    const outputPath = this.outputManager.saveSingleRouteAnalysis(html, route.name);
    console.log(
      `Single route analysis generated: ${this.outputManager.getRelativePath(outputPath)}`
    );
  }

  showAvailableRoutes() {
    console.log("\nAvailable routes:");
    this.routes.forEach((route, index) => {
      const stats = route.calculateStats();
      console.log(`\n${index}: ${route.name}`);
      console.log(`   Distance: ${stats.totalDistanceKm.toFixed(2)} km`);
      console.log(`   Duration: ${stats.formattedDuration}`);
    });
  }
}

// Main execution
const analyzer = new RouteAnalyzer("strava_export/activities");
const routeIndex = parseInt(process.argv[2]);

if (isNaN(routeIndex)) {
  analyzer.loadRoutes(); // Load all routes for listing
  console.log("Please provide a valid route index");
  console.log("\nUsage: node analyzeGPX.js <index>");
  console.log("Example: node analyzeGPX.js 0");
  analyzer.showAvailableRoutes();
} else {
  analyzer.loadRoutes(routeIndex); // Only load the selected route
  analyzer.generateSingleRouteAnalysis(0); // Since we only loaded one route, it's at index 0
}
