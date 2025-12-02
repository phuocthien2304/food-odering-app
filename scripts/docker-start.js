#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

console.log("🚀 Starting Food Ordering Microservices...\n")

// Check if backend directory exists
const backendPath = path.join(process.cwd(), "backend")
if (!fs.existsSync(backendPath)) {
  console.error("❌ Error: backend directory not found")
  console.error("Please run: npm run migrate")
  process.exit(1)
}

// Check if services exist in backend
const requiredServices = [
  "api-gateway",
  "user-service",
  "order-service",
  "restaurant-service",
  "delivery-service",
  "payment-service",
]

let missing = false
for (const service of requiredServices) {
  const servicePath = path.join(backendPath, service)
  if (!fs.existsSync(servicePath)) {
    console.error(`❌ Missing: backend/${service}`)
    missing = true
  }
}

if (missing) {
  console.error("\n❌ Some services are missing in backend/")
  console.error("Please run: npm run migrate")
  process.exit(1)
}

console.log("✓ All services found\n")
console.log(`Starting services from: ${process.cwd()}\n`)

try {
  console.log("Starting backend services...")
  // Start docker compose from backend directory
  execSync("docker compose up -d", {
    cwd: backendPath,
    stdio: "inherit",
  })

  console.log("\n✅ Services started successfully!\n")
  console.log("📊 Service URLs:")
  console.log("  • API Gateway:        http://localhost:3000")
  console.log("  • User Service:       http://localhost:3003")
  console.log("  • Order Service:      http://localhost:3001")
  console.log("  • Restaurant Service: http://localhost:3002")
  console.log("  • Delivery Service:   http://localhost:3004")
  console.log("  • Payment Service:    http://localhost:3005")
  console.log("  • RabbitMQ Console:   http://localhost:15672 (guest/guest)")
  console.log("  • MongoDB:            mongodb://localhost:27017")
  console.log("  • Frontend:           http://localhost:5173 (run: npm run frontend:dev)")
  console.log("\n📝 Monitor logs: npm run docker:logs\n")
} catch (error) {
  console.error("❌ Error starting services:", error.message)
  process.exit(1)
}
