import express, { type Request, type Response } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

// Keep track of active requests for graceful shutdown
let activeRequests = 0;
let isShuttingDown = false;

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Configure timeouts
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds (must be > keepAliveTimeout)
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));
  
  // Middleware to track active requests
  app.use((req, res, next) => {
    if (isShuttingDown) {
      res.status(503).json({ error: "Server is shutting down" });
      return;
    }
    
    activeRequests++;
    let requestFinished = false;
    
    const decrementRequest = () => {
      if (!requestFinished) {
        requestFinished = true;
        activeRequests--;
      }
    };
    
    res.on("finish", decrementRequest);
    res.on("close", decrementRequest);
    
    next();
  });
  
  // Request timeout middleware (60 seconds)
  app.use((req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: "Request timeout" });
      }
      req.socket.destroy();
    }, 60000);
    
    res.on("finish", () => clearTimeout(timeout));
    res.on("close", () => clearTimeout(timeout));
    
    next();
  });
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Image upload endpoint
  app.post('/api/upload', async (req, res) => {
    try {
      const { imageData, fileName } = req.body;
      if (!imageData || !fileName) {
        return res.status(400).json({ error: 'Missing imageData or fileName' });
      }
      
      // Convert base64 to buffer
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Import storagePut here to avoid circular dependencies
      const { storagePut } = await import('../storage');
      const { url } = await storagePut(`products/${fileName}`, buffer, 'image/jpeg');
      
      res.json({ url });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
  
  // Health check endpoint with detailed metrics
  app.get('/api/health', (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      activeRequests,
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },
      database: 'connected',
    });
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`[Server] Keep-alive timeout: 65s, Headers timeout: 66s`);
  });
  
  // Graceful shutdown handlers
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}, starting graceful shutdown...`);
    isShuttingDown = true;
    
    // Stop accepting new connections
    server.close(() => {
      console.log('[Server] Server closed');
      process.exit(0);
    });
    
    // Wait for active requests to complete (max 10 seconds)
    let waitTime = 0;
    const checkInterval = setInterval(() => {
      if (activeRequests === 0) {
        clearInterval(checkInterval);
        console.log('[Server] All requests completed');
      } else if (waitTime >= 10000) {
        clearInterval(checkInterval);
        console.log(`[Server] Force closing ${activeRequests} active requests after 10s`);
      }
      waitTime += 100;
    }, 100);
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught exception:', error);
    gracefulShutdown('uncaughtException');
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled rejection at:', promise, 'reason:', reason);
  });
}

startServer().catch(console.error);
