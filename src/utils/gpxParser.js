const fs = require("fs");
const { DOMParser } = require("@xmldom/xmldom");
const toGeoJSON = require("@tmcw/togeojson");
const Run = require("../models/Run");

class GPXParser {
  static readGPXFile(filePath, verbose = true) {
    try {
      const gpxContent = fs.readFileSync(filePath, "utf8");
      const parser = new DOMParser();
      const gpxDoc = parser.parseFromString(gpxContent, "text/xml");

      // Extract time data directly from XML for more reliable parsing
      const trackPoints = Array.from(gpxDoc.getElementsByTagName("trkpt"));
      const times = trackPoints.map((trkpt) => {
        const timeElement = trkpt.getElementsByTagName("time")[0];
        return timeElement ? timeElement.textContent : null;
      });

      // Extract heart rate data
      const heartRates = trackPoints.map((trkpt) => {
        const hrElement = trkpt.getElementsByTagName("gpxtpx:hr")[0];
        return hrElement ? parseInt(hrElement.textContent) : null;
      });

      // Convert to GeoJSON for coordinate data
      const geoJSON = toGeoJSON.gpx(gpxDoc);
      const coordinates = geoJSON.features[0].geometry.coordinates;

      if (verbose) {
        console.log("First time string:", times[0]);
        console.log("Last time string:", times[times.length - 1]);
      }

      // Combine all data
      const points = coordinates.map((coord, index) => {
        const timeStr = times[index];
        let timestamp = null;

        if (timeStr) {
          try {
            // Parse ISO 8601 date string to timestamp
            timestamp = Date.parse(timeStr);
            if (isNaN(timestamp)) {
              if (verbose) console.log("Invalid date from string:", timeStr);
            }
          } catch (err) {
            if (verbose) console.log("Error parsing date:", timeStr, err);
          }
        }

        if (verbose && (index === 0 || index === times.length - 1)) {
          console.log(`Point ${index} time:`, {
            original: timeStr,
            parsed: timestamp ? new Date(timestamp).toISOString() : null,
            timestamp,
          });
        }

        return {
          latitude: coord[1],
          longitude: coord[0],
          elevation: coord[2],
          heartRate: heartRates[index],
          time: timestamp,
        };
      });

      if (verbose) {
        // Log first and last points
        console.log("First point:", {
          time: points[0].time,
          date: points[0].time ? new Date(points[0].time).toISOString() : null,
        });
        console.log("Last point:", {
          time: points[points.length - 1].time,
          date: points[points.length - 1].time
            ? new Date(points[points.length - 1].time).toISOString()
            : null,
        });
      }

      return points;
    } catch (error) {
      console.error(`Error reading GPX file ${filePath}:`, error);
      return null;
    }
  }
}

module.exports = GPXParser;
