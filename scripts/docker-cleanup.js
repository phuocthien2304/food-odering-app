#!/usr/bin/env node

const { execSync } = require("child_process")

console.log("🧹 Cleaning up Docker resources...\n")

const ports = [3000, 3001, 3002, 3003, 3004, 3005, 5672, 15672, 27017, 5173]

try {
  // Stop all containers
  console.log("Stopping all containers...")
  try {
    execSync("docker compose down", {
      stdio: "inherit",
      cwd: "./backend",
    })
  } catch (e) {
    // Ignore if no services are running
  }

  // Remove all containers
  console.log("\nRemoving containers...")
  try {
    execSync("docker rm -f $(docker ps -aq)", {
      stdio: "inherit",
      shell: process.platform === "win32" ? "powershell.exe" : "/bin/bash",
    })
  } catch (e) {
    // Ignore if no containers exist
  }

  // Prune system
  console.log("\nPruning Docker system...")
  execSync("docker system prune -f", { stdio: "inherit" })

  console.log("\n✅ Cleanup complete!\n")
  console.log("Ready to start fresh: npm run docker:up\n")
} catch (error) {
  console.error("⚠️ Warning during cleanup:", error.message)
  console.log("\nManual cleanup: docker compose down && docker system prune -f\n")
}
