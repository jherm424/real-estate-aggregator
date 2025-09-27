# Real Estate Listing Aggregator

A comprehensive real estate listing aggregator that scrapes multiple real estate board websites, provides filtering and favorites functionality.

## Project Structure

```
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── scrapers/       # Web scraping modules
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── database/           # Database migrations and seeds
│   └── tests/              # Backend tests
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   └── utils/          # Frontend utilities
│   └── public/             # Static assets
├── docker/                 # Docker configuration
└── docs/                   # Documentation
```

## Features

- **Web Scraping System**: Modular scrapers for multiple real estate boards
- **Automatic Updates**: Scheduled scraping every 4-6 hours
- **Advanced Filtering**: Price, location, property type, bedrooms, bathrooms, etc.
- **User Favorites**: Save and manage favorite listings
- **Data Persistence**: PostgreSQL with deduplication and status tracking
- **RESTful API**: Clean API for frontend consumption
- **Responsive UI**: Modern React interface

## Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: React, Next.js
- **Scraping**: Puppeteer with anti-detection measures
- **Scheduling**: Node-cron
- **Deployment**: Docker

## Quick Start

### Development
```bash
# Complete setup
make dev-setup

# Start backend services
make dev

# Start frontend (separate terminal)
cd frontend && npm run dev
```

### Production
```bash
# Deploy everything
make deploy

# Access: http://localhost
```

## Detailed Setup

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

### Manual Setup

1. **Install dependencies**:
   ```bash
   make install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker**:
   ```bash
   make dev  # Development
   make start  # Production
   ```

## Legal & Compliance

- Respects robots.txt files
- Implements proper rate limiting
- Uses appropriate user agents
- Monitors for anti-bot measures