# Upivot - Interview Drills MERN App

A full-stack interview preparation platform built with React, Node.js, Express, MongoDB, and Redis. Features Google/LinkedIn OAuth, drill taking with intelligent scoring, and performance tracking.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone & Setup
```bash
git clone <your-repo-url>
cd upivot

# Copy environment template
cp .env.example .env

# Edit .env with your OAuth credentials (see OAuth Setup below)
```

### 2. OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5001/auth/google/callback`
6. Add to `.env`:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

#### LinkedIn OAuth (Bonus)
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add OAuth redirect URL: `http://localhost:5001/auth/linkedin/callback`
4. Add to `.env`:
```env
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
```

### 3. Generate Secure Secrets
```bash
# Generate JWT secret
openssl rand -hex 32

# Generate session secret  
openssl rand -hex 32

# Add these to your .env file:
JWT_SECRET=<generated-jwt-secret>
SESSION_SECRET=<generated-session-secret>
```

⚠️ **Security Warning**: Never commit your `.env` file or expose real secrets in your repository!

# Generate session secret  
openssl rand -hex 32

# Add to .env:
JWT_SECRET=your_generated_jwt_secret
SESSION_SECRET=your_generated_session_secret
```

### 4. Run Application
```bash
# Start all services
docker-compose up

# Or use Make commands (if available)
make up
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **API**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express + Passport.js
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Auth**: OAuth 2.0 (Google + LinkedIn)
- **Deployment**: Docker + Docker Compose

### API Endpoints
```
GET  /api/health              - Health check
GET  /api/me                  - Current user (auth required)
GET  /api/drills              - List all drills (cached 60s)
GET  /api/drills/:id          - Get specific drill
POST /api/attempts            - Submit drill attempt (auth required)  
GET  /api/attempts?limit=5    - Get user attempts (auth required)

# Authentication
GET  /auth/google             - Google OAuth
GET  /auth/google/callback    - Google OAuth callback
GET  /auth/linkedin           - LinkedIn OAuth  
GET  /auth/linkedin/callback  - LinkedIn OAuth callback
POST /auth/logout             - Logout
```

### Database Schema
- **users**: `_id`, `email`, `name`, `picture`, `providers`, `createdAt`
- **drills**: `_id`, `title`, `difficulty`, `tags`, `questions`, `createdAt`
- **attempts**: `_id`, `userId`, `drillId`, `answers`, `score`, `timeSpent`, `createdAt`

## 🧪 Testing

### Run k6 Performance Tests
```bash
# Install k6 (macOS)
brew install k6

# Run performance tests (targets 300 req/sec for 60s)
k6 run k6/script.js

# Expected: <150ms for cached drills endpoint
```

### API Testing
Import `Upivot-API-Collection.postman_collection.json` into Postman/Insomnia for complete API testing.

### Manual Testing Flow
1. Visit http://localhost:3000
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Browse drills on dashboard
5. Take a 5-question drill
6. Submit answers and view score
7. Check history page for attempt tracking

## 🔒 Security Features

- **Authentication**: OAuth 2.0 with secure session management
- **Authorization**: Protected routes with JWT validation
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configured for specific origins
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Joi schema validation
- **Session Security**: httpOnly, secure cookies

## ⚡ Performance Features

- **MongoDB Connection Pooling**: Optimized database connections
- **Redis Caching**: 60-second cache for drills endpoint
- **Lazy Loading**: Code splitting for optimal bundle size
- **Compression**: Gzip compression for API responses
- **Database Indexing**: Optimized queries with proper indexes

## 🐳 Docker Services

```yaml
services:
  web:     # React app (port 3000)
  api:     # Express server (port 5001) 
  mongo:   # MongoDB (port 27017)
  redis:   # Redis cache (port 6379)
```

## 📁 Project Structure

```
upivot/
├── web/                    # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── styles/        # CSS styles
├── api/                   # Express backend  
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── models/        # MongoDB models
│   │   ├── middleware/    # Custom middleware
│   │   └── services/      # Business logic
├── docs/                  # Documentation
├── k6/                    # Performance tests
└── docker-compose.yml     # Container orchestration
```

## 🛠️ Development Commands

```bash
# Start development environment
docker-compose up

# Rebuild containers (after dependency changes)
docker-compose build --no-cache

# View logs
docker-compose logs -f [service_name]

# Stop all services
docker-compose down

# Database operations
docker-compose exec api npm run seed    # Seed sample data
docker-compose exec api npm run reset   # Reset database
```

## 🔍 Monitoring & Debugging

### Application Logs
```bash
# API logs
docker-compose logs -f api

# Frontend logs  
docker-compose logs -f web

# Database logs
docker-compose logs -f mongo
```

### Health Checks
- API Health: http://localhost:5001/api/health
- Frontend: http://localhost:3000
- Database: `docker-compose exec mongo mongosh`
- Redis: `docker-compose exec redis redis-cli ping`

## 🚦 Known Limitations

1. **OAuth Localhost**: OAuth may require HTTPS in production
2. **File Uploads**: No file upload capability currently
3. **Real-time Features**: No WebSocket support yet
4. **Email Notifications**: No email service integration
5. **Advanced Scoring**: Basic keyword matching only

## 🚀 Next Steps & Deployment

### Production Deployment
- **Frontend**: Deploy to S3 + CloudFront
- **Backend**: Deploy to EC2/ECS with ALB
- **Database**: MongoDB Atlas or AWS DocumentDB
- **Cache**: AWS ElastiCache Redis
- **Secrets**: AWS Secrets Manager
- **Monitoring**: CloudWatch + DataDog

### Feature Roadmap
- [ ] Advanced AI-powered scoring
- [ ] Video interview simulations  
- [ ] Real-time collaborative drills
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard for recruiters

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Ensure OAuth credentials are correctly configured
4. Check that all Docker containers are running

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for interview preparation**
