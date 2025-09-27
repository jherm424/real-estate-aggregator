# Real Estate Aggregator - Deployment Guide

## Quick Start

### Development Setup

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd MySecondProject
   make dev-setup
   ```

2. **Start development environment**:
   ```bash
   make dev
   ```

3. **Start frontend separately**:
   ```bash
   cd frontend && npm run dev
   ```

### Production Deployment

1. **Deploy with Docker**:
   ```bash
   make deploy
   ```

2. **Access the application**:
   - Frontend: http://localhost
   - API: http://localhost/api
   - Database: localhost:5432

## Environment Variables

Copy `.env.docker` to `.env` and update:

```bash
# Required
DB_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-key

# Optional
SCRAPING_SCHEDULE=0 */6 * * *
CLEANUP_SCHEDULE=0 2 * * *
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Architecture

### Services

- **Frontend**: Next.js React application
- **Backend**: Node.js/Express API server
- **Database**: PostgreSQL with full-text search
- **Redis**: Caching and session storage
- **Nginx**: Reverse proxy and load balancer

### Key Features

- **Web Scraping**: Automated scraping with anti-detection
- **API Layer**: RESTful API with rate limiting
- **Real-time Updates**: Scheduled scraping every 6 hours
- **Advanced Filtering**: Price, location, property details
- **User Management**: Favorites and saved searches
- **Admin Dashboard**: Scraping logs and statistics

## API Endpoints

### Listings
- `GET /api/listings` - List all listings with filters
- `GET /api/listings/:id` - Get specific listing
- `GET /api/listings/filters/options` - Get filter options

### Favorites
- `GET /api/favorites/:userId` - Get user favorites
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites/:id` - Remove favorite

### Searches
- `GET /api/searches/:userId` - Get saved searches
- `POST /api/searches` - Save search
- `PUT /api/searches/:id` - Update search

### Statistics
- `GET /api/stats` - General statistics
- `GET /api/stats/cities` - City-wise statistics
- `GET /api/stats/trends` - Trend data

### Scraping
- `GET /api/scraping/status` - Scraping status
- `POST /api/scraping/start/:source` - Start scraper
- `GET /api/scraping/logs` - Scraping logs

### Scheduler
- `GET /api/scheduler/status` - Scheduler status
- `POST /api/scheduler/start` - Start scheduler
- `POST /api/scheduler/run-manual` - Manual scraping

## Database Schema

### Main Tables

- **listings**: Property listings with full details
- **users**: User accounts and preferences
- **favorites**: User favorite listings
- **saved_searches**: User saved search criteria
- **scraping_logs**: Scraping session logs

### Key Indexes

- Location-based queries (lat/lng)
- Price range filtering
- Property type and features
- Full-text search on titles/descriptions

## Scraping System

### Base Scraper Features

- **Anti-detection**: User agent rotation, stealth mode
- **Rate limiting**: Configurable delays between requests
- **Error handling**: Retry logic and failure recovery
- **Data validation**: Price parsing, address normalization
- **Status tracking**: Comprehensive logging system

### Currently Supported Sources

- **Realtor.ca**: Canadian real estate listings
- **Extensible**: Easy to add new sources

### Scheduling

- **Automatic**: Runs every 6 hours by default
- **Manual**: API endpoints for on-demand scraping
- **Cleanup**: Daily cleanup of old data
- **Health checks**: System monitoring

## Development

### Adding New Scrapers

1. Create new scraper class extending `BaseScraper`
2. Implement required methods: `scrape()`, data parsing
3. Add to `scraperManager` in `src/scrapers/index.js`
4. Test with manual scraping endpoint

### Frontend Development

```bash
cd frontend
npm run dev
```

### Backend Development

```bash
cd backend
npm run dev
```

### Database Migrations

```bash
make migrate
```

## Production Considerations

### Security

- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Environment variable protection

### Performance

- Database indexes for common queries
- Image optimization and CDN
- Caching layer with Redis
- Nginx compression and caching

### Monitoring

- Application health checks
- Scraping success/failure tracking
- Database performance monitoring
- Error logging and alerting

### Scaling

- Horizontal scaling with Docker Swarm/Kubernetes
- Database read replicas
- Queue system for large scraping jobs
- CDN for static assets

## Troubleshooting

### Common Issues

1. **Database connection fails**: Check PostgreSQL container status
2. **Scraping fails**: Verify target website accessibility
3. **Frontend API errors**: Check CORS and API URL configuration
4. **Docker build fails**: Ensure sufficient disk space

### Logs

```bash
# All services
make logs

# Specific service
make logs-backend
make logs-frontend
make logs-db
```

### Database Access

```bash
# Database shell
make shell-db

# Backup database
make backup-db

# Restore database
make restore-db BACKUP_FILE=backups/backup_20231201_120000.sql
```

## Legal Compliance

- Respects robots.txt files
- Implements proper rate limiting
- Uses appropriate user agents
- Monitors for anti-bot measures
- Includes proper attribution

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure lint passes: `make lint`
5. Submit pull request

## License

This project is for educational purposes. Ensure compliance with target website terms of service and local laws before production use.