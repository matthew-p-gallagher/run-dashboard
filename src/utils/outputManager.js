const fs = require("fs");
const path = require("path");

class OutputManager {
  constructor(baseDir = "output") {
    this.baseDir = baseDir;
    this.ensureDirectoryStructure();
  }

  ensureDirectoryStructure() {
    // Create main output directory
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir);
    }

    // Create analysis directory
    const analysisDir = path.join(this.baseDir, "analysis");
    if (!fs.existsSync(analysisDir)) {
      fs.mkdirSync(analysisDir);
    }
  }

  saveSingleRouteAnalysis(html, routeName) {
    const sanitizedName = this.sanitizeFileName(routeName);
    const filePath = path.join(this.baseDir, "analysis", `route_${sanitizedName}.html`);
    fs.writeFileSync(filePath, html);
    return filePath;
  }

  sanitizeFileName(fileName) {
    // Remove or replace invalid characters
    return fileName
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  }

  getRelativePath(absolutePath) {
    return path.relative(process.cwd(), absolutePath);
  }
}

module.exports = OutputManager;
