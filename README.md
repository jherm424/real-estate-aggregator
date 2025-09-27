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

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Configure environment variables
5. Run migrations: `npm run migrate`
6. Start development server: `npm run dev`

## Legal & Compliance

- Respects robots.txt files
- Implements proper rate limiting
- Uses appropriate user agents
- Monitors for anti-bot measures