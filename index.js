import express from 'express';
import { ParseServer } from 'parse-server';
import ParseDashboard from 'parse-dashboard';
import redis from 'redis';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 1337;
const PARSE_MOUNT = '/parse';
const DASHBOARD_MOUNT = '/dashboard';

// MongoDB URI
const mongoUri = process.env.MONGODB_URI || 'mongodb://mongo:27017/parse';

// Redis Client Setup
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis Connected'));

// Connect to Redis
await redisClient.connect().catch(err => {
  console.warn('⚠️ Redis connection failed, continuing without cache:', err.message);
});

// Parse Server Configuration
const parseServerConfig = {
  databaseURI: mongoUri,
  cloud: path.join(__dirname, 'cloud', 'main.js'),
  appId: process.env.APP_ID || 'parse-app-id-123456789',
  masterKey: process.env.MASTER_KEY || 'parse-master-key-123456789',
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
  publicServerURL: process.env.PUBLIC_SERVER_URL || 'http://localhost:1337/parse',
  
  // Cache Configuration
  cacheAdapter: {
    module: 'parse-server-redis-cache-adapter',
    options: {
      redisClient: redisClient,
      ttl: 600, // 10 minutes
    },
  },
  
  // Live Query Configuration
  liveQuery: {
    classNames: ['_Session', 'User', 'Post', 'Comment', 'Message'],
    redisURL: process.env.REDIS_URL || 'redis://redis:6379',
  },
  
  // File Adapter
  filesAdapter: 'parse-server-fs',
  
  // Class Level Permissions - Full Access for Everyone
  classLevelPermissions: {
    '*': {
      'find': { '*': true },
      'count': { '*': true },
      'get': { '*': true },
      'create': { '*': true },
      'update': { '*': true },
      'delete': { '*': true },
      'addField': { '*': true },
    },
  },
  
  // Allow Client Class Creation
  allowClientClassCreation: true,
  allowCustomObjectId: true,
  
  // Disable Private Users
  enforcePrivateUsers: false,
  
  // Session Configuration
  revokeSessionOnPasswordChange: false,
  
  // Email Configuration (Optional)
  emailAdapter: {
    module: 'parse-server-simple-mailgun-adapter',
    options: {
      fromAddress: process.env.EMAIL_FROM || 'noreply@example.com',
      domain: process.env.MAILGUN_DOMAIN || 'mg.example.com',
      apiKey: process.env.MAILGUN_API_KEY || '',
    },
  },
};

// Initialize Parse Server
const parseServer = new ParseServer(parseServerConfig);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Parse-Application-Id, X-Parse-Master-Key, X-Parse-Session-Token');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Mount Parse Server
await parseServer.start();
app.use(PARSE_MOUNT, parseServer.app);

// Parse Dashboard Configuration
const dashboardConfig = {
  apps: [
    {
      serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
      appId: process.env.APP_ID || 'parse-app-id-123456789',
      masterKey: process.env.MASTER_KEY || 'parse-master-key-123456789',
      appName: 'Parse Server App',
      production: true,
    },
  ],
  users: [
    {
      user: process.env.DASHBOARD_USER || 'admin',
      pass: process.env.DASHBOARD_PASSWORD || 'admin123',
    },
  ],
  trustProxy: 1,
};

// Mount Parse Dashboard
app.use(DASHBOARD_MOUNT, ParseDashboard(dashboardConfig, true));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    parseServer: 'running',
    liveQueries: 'enabled',
    redis: redisClient.isOpen ? 'connected' : 'disconnected',
  });
});

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Parse Server 4.10.4 is running',
    version: '1.0.0',
    features: ['Live Queries', 'Redis Cache', 'Parse Dashboard', 'Full Public Access'],
    endpoints: {
      parse: `http://localhost:${PORT}/parse`,
      dashboard: `http://localhost:${PORT}/dashboard`,
      health: `http://localhost:${PORT}/health`,
    },
  });
});

// Create HTTP Server
const httpServer = http.createServer(app);

// WebSocket Server for Live Queries
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  console.log('✅ WebSocket client connected');
  
  ws.on('message', (message) => {
    console.log('📨 WebSocket message:', message);
  });
  
  ws.on('close', () => {
    console.log('❌ WebSocket client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                  Parse Server 4.10.4                       ║
║                   Production Ready                         ║
╚════════════════════════════════════════════════════════════╝

✅ Server running on http://localhost:${PORT}
✅ Parse API: http://localhost:${PORT}/parse
✅ Dashboard: http://localhost:${PORT}/dashboard
✅ Health Check: http://localhost:${PORT}/health

📊 Features Enabled:
  • Live Queries
  • Redis Cache
  • Parse Dashboard
  • Full Public Access (All Users)
  • Cloud Functions

🔐 Security:
  • App ID: ${process.env.APP_ID || 'parse-app-id-123456789'}
  • Master Key: ${process.env.MASTER_KEY ? '***' : 'parse-master-key-123456789'}

📦 Database: ${mongoUri}
🔴 Redis: ${redisClient.isOpen ? 'Connected' : 'Disconnected'}

Ready to accept connections...
  `);
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await redisClient.quit();
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;
