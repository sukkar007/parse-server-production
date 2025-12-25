# Parse Server 4.10.4 - Production Ready

A fully configured Parse Server with Live Queries, Redis Cache, Parse Dashboard, and full public access for all users.

## Features

✅ **Parse Server 4.10.4** - Latest stable version  
✅ **Live Queries** - Real-time data synchronization  
✅ **Redis Cache** - High-performance caching  
✅ **Parse Dashboard** - Web-based management interface  
✅ **Full Public Access** - All users have complete CRUD permissions  
✅ **Cloud Functions** - Ready-to-use database operations  
✅ **Docker Support** - Easy deployment with Docker Compose  

## Quick Start

### Prerequisites

- Node.js 18+ or Docker
- MongoDB
- Redis

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd parse-server-production
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the server**
```bash
npm start
```

The server will be available at:
- **API**: http://localhost:1337/parse
- **Dashboard**: http://localhost:1337/dashboard
- **Health Check**: http://localhost:1337/health

### Docker Deployment

1. **Using Docker Compose (Recommended)**
```bash
docker-compose up -d
```

This will start:
- Parse Server on port 1337
- MongoDB on port 27017
- Redis on port 6379

2. **Access the services**
- **API**: http://localhost:1337/parse
- **Dashboard**: http://localhost:1337/dashboard (admin/admin123)
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://root:root123@mongo:27017/parse?authSource=admin

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379

# Parse Server
APP_ID=parse-app-id-123456789
MASTER_KEY=parse-master-key-123456789
SERVER_URL=http://localhost:1337/parse
PUBLIC_SERVER_URL=http://localhost:1337/parse

# Dashboard
DASHBOARD_USER=admin
DASHBOARD_PASSWORD=admin123

# Server
PORT=1337
NODE_ENV=production
```

## Cloud Functions

All users have access to the following cloud functions:

### Table Management
- `createTable` - Create a new table/class
- `listTables` - List all tables
- `getTableSchema` - Get table structure
- `deleteTable` - Delete a table

### Record Operations
- `createRecord` - Create a new record
- `readTable` - Query records with filters
- `updateRecord` - Update an existing record
- `deleteRecord` - Delete a record
- `batchCreateRecords` - Create multiple records at once
- `countRecords` - Count records with optional filters

### Utility
- `getServerInfo` - Get server information
- `healthCheck` - Health check endpoint

## API Examples

### Using Parse SDK (JavaScript)

```javascript
// Initialize Parse
Parse.initialize('parse-app-id-123456789');
Parse.serverURL = 'http://localhost:1337/parse';

// Create a record
const MyClass = Parse.Object.extend('MyClass');
const obj = new MyClass();
obj.set('name', 'Test');
await obj.save();

// Query records
const query = new Parse.Query('MyClass');
const results = await query.find();

// Call cloud function
const result = await Parse.Cloud.run('createTable', {
  className: 'Users',
  schema: { name: 'John', email: 'john@example.com' }
});
```

### Using REST API

```bash
# Create a record
curl -X POST http://localhost:1337/parse/classes/MyClass \
  -H "X-Parse-Application-Id: parse-app-id-123456789" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'

# Query records
curl http://localhost:1337/parse/classes/MyClass \
  -H "X-Parse-Application-Id: parse-app-id-123456789"

# Call cloud function
curl -X POST http://localhost:1337/parse/functions/createTable \
  -H "X-Parse-Application-Id: parse-app-id-123456789" \
  -H "Content-Type: application/json" \
  -d '{"className":"Users"}'
```

## Security Notes

⚠️ **Important**: This configuration allows full public access to all data. For production use:

1. Change the `APP_ID` and `MASTER_KEY`
2. Change the `DASHBOARD_USER` and `DASHBOARD_PASSWORD`
3. Implement proper authentication and authorization
4. Use environment variables for sensitive data
5. Enable HTTPS in production
6. Set up proper firewall rules

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running and accessible
- Check `MONGODB_URI` environment variable
- Verify MongoDB credentials

### Redis Connection Issues
- Ensure Redis is running on the specified host/port
- Check `REDIS_HOST` and `REDIS_PORT` environment variables
- Redis connection failures are non-fatal; server will continue without cache

### Dashboard Access Issues
- Verify dashboard credentials in environment variables
- Check that the server is running on the correct port
- Clear browser cache and try again

## Performance Tips

1. **Enable Redis Caching** - Already configured by default
2. **Use Live Queries Sparingly** - Only subscribe to classes that need real-time updates
3. **Optimize Database Queries** - Use filters and limits
4. **Monitor Server Logs** - Check for slow queries and errors
5. **Scale Horizontally** - Use multiple Parse Server instances with a load balancer

## Support

For issues and questions:
- [Parse Server Documentation](https://docs.parseplatform.org/)
- [Parse Community](https://community.parseplatform.org/)
- [GitHub Issues](https://github.com/parse-community/parse-server/issues)

## License

MIT

---

**Made with ❤️ for Parse Community**
