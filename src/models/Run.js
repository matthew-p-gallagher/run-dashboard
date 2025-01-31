const geolib = require("geolib");

class Run {
  constructor(name, points) {
    this.name = name;
    this.points = points || [];

    // Find first and last valid timestamps
    const validPoints = this.points.filter((p) => p.time !== null && !isNaN(p.time));
    this.startTime = validPoints.length > 0 ? validPoints[0].time : null;
    this.endTime = validPoints.length > 0 ? validPoints[validPoints.length - 1].time : null;

    console.log("Run Constructor:", {
      name,
      totalPoints: points?.length || 0,
      validTimePoints: validPoints.length,
      startTime: this.startTime ? new Date(this.startTime).toISOString() : null,
      endTime: this.endTime ? new Date(this.endTime).toISOString() : null,
    });

    // Format the date from the timestamp
    this.date = this.startTime ? new Date(this.startTime).toISOString().split("T")[0] : null;
  }

  calculateStats() {
    if (!this.points || this.points.length === 0) {
      console.log("No points available for stats calculation");
      return {
        name: this.name,
        date: this.date,
        startTime: null,
        endTime: null,
        totalDistanceKm: 0,
        totalTimeMinutes: 0,
        paceMinKm: 0,
        formattedPace: "--:--/km",
        elevationGainM: 0,
        avgHeartRate: 0,
        maxHeartRate: 0,
      };
    }

    let totalDistance = 0;
    let elevationGain = 0;
    const heartRates = this.points.filter((p) => p.heartRate).map((p) => p.heartRate);

    // Calculate distance and elevation gain
    for (let i = 1; i < this.points.length; i++) {
      const point1 = {
        latitude: this.points[i - 1].latitude,
        longitude: this.points[i - 1].longitude,
      };
      const point2 = {
        latitude: this.points[i].latitude,
        longitude: this.points[i].longitude,
      };

      // Only add distance if both points have valid coordinates
      if (point1.latitude && point1.longitude && point2.latitude && point2.longitude) {
        const segmentDistance = geolib.getDistance(point1, point2);
        totalDistance += segmentDistance;
      }

      const elevationDiff =
        this.points[i].elevation && this.points[i - 1].elevation
          ? this.points[i].elevation - this.points[i - 1].elevation
          : 0;
      if (elevationDiff > 0) elevationGain += elevationDiff;
    }

    const totalTime = this.getDurationSeconds();
    const totalDistanceKm = totalDistance / 1000;
    const totalTimeMinutes = totalTime / 60;

    console.log("Stats Calculation:", {
      totalDistance,
      totalDistanceKm,
      totalTimeSeconds: totalTime,
      totalTimeMinutes,
      startTime: this.startTime ? new Date(this.startTime).toISOString() : null,
      endTime: this.endTime ? new Date(this.endTime).toISOString() : null,
    });

    // Calculate pace only if we have both valid distance and time
    const paceMinKm =
      totalDistanceKm > 0 && totalTimeMinutes > 0 ? totalTimeMinutes / totalDistanceKm : 0;

    console.log("Pace Calculation:", {
      paceMinKm,
      formattedPace: this.formatPace(paceMinKm),
    });

    const avgHeartRate =
      heartRates.length > 0 ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : 0;
    const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : 0;

    const formattedDuration = this.formatDuration(totalTimeMinutes);

    return {
      name: this.name,
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
      totalDistanceKm,
      totalTimeMinutes,
      formattedDuration,
      paceMinKm,
      formattedPace: this.formatPace(paceMinKm),
      elevationGainM: elevationGain,
      avgHeartRate: Math.round(avgHeartRate),
      maxHeartRate: maxHeartRate,
    };
  }

  // Date and time formatting methods
  getFormattedDate() {
    if (!this.date) return "Unknown Date";
    return new Date(this.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  getFormattedStartTime() {
    if (!this.startTime) return "Unknown Time";
    return new Date(this.startTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Time-related methods
  getDurationSeconds() {
    if (!this.startTime || !this.endTime || isNaN(this.startTime) || isNaN(this.endTime)) {
      console.log("Invalid duration calculation:", {
        startTime: this.startTime,
        endTime: this.endTime,
        startTimeValid: !isNaN(this.startTime),
        endTimeValid: !isNaN(this.endTime),
      });
      return 0;
    }
    const duration = (this.endTime - this.startTime) / 1000; // Convert milliseconds to seconds
    console.log("Duration calculation:", {
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(this.endTime).toISOString(),
      durationSeconds: duration,
    });
    return duration > 0 ? duration : 0;
  }

  getDurationMinutes() {
    return this.getDurationSeconds() / 60;
  }

  getDurationHours() {
    return this.getDurationMinutes() / 60;
  }

  getAveragePace() {
    const stats = this.calculateStats();
    return stats.paceMinKm;
  }

  getFormattedAveragePace() {
    return this.formatPace(this.getAveragePace());
  }

  formatDuration(minutes) {
    if (!minutes || minutes <= 0) return "--:--:--";

    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.round((minutes * 60) % 60);

    // Always use HH:MM:SS format
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  formatPace(paceMinKm) {
    if (!paceMinKm || paceMinKm <= 0) return "--:--/km";
    const minutes = Math.floor(paceMinKm);
    const seconds = Math.round((paceMinKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
  }

  // Existing methods
  getCoordinates() {
    return this.points.map((point) => [point.latitude, point.longitude]);
  }

  getElevationData() {
    return this.points.map((point) => point.elevation);
  }

  getHeartRateData() {
    return this.points.map((point) => point.heartRate);
  }

  getTimeData() {
    return this.points.map((point) => point.time);
  }

  getTimestamps() {
    return this.points.map((point) => ({
      absolute: point.time,
      relative: point.time ? (point.time - this.startTime) / 1000 : null,
    }));
  }

  getCenterPoint() {
    return {
      latitude: this.points[0].latitude,
      longitude: this.points[0].longitude,
    };
  }
}

module.exports = Run;
