#!/usr/bin/env node

/**
 * Keep-alive script to prevent server hibernation
 * Pings the server every 5 minutes to keep it awake
 * Extra security: pings every 5 minutes instead of longer intervals
 */

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

async function ping() {
  try {
    const response = await fetch(`${SERVER_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const timestamp = new Date().toISOString();
    if (response.ok) {
      console.log(`[${timestamp}] ✅ Keep-alive ping successful`);
    } else {
      console.warn(`[${timestamp}] ⚠️ Keep-alive ping failed: ${response.status}`);
    }
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ Keep-alive ping error:`, error.message);
  }
}

// Start pinging immediately and then every 5 minutes
console.log(`[${new Date().toISOString()}] 🚀 Keep-alive service started (pinging every 5 minutes for extra security)`);
ping(); // First ping immediately
setInterval(ping, PING_INTERVAL);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] 🛑 Keep-alive service stopping...`);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] 🛑 Keep-alive service interrupted...`);
  process.exit(0);
});
