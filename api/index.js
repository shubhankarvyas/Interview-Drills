const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const compression = require('compression');
const slowDown = require('express-slow-down');
const { RedisStore: RateLimitRedis } = require('rate-limit-redis');

const app = express();

// Redis client setup
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '10mb' }));

// Rate limiting with Redis
const limiter = rateLimit({
  store: new RateLimitRedis({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Speed limiting
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 50
});

app.use(limiter);
app.use(speedLimiter);

// Session configuration with Redis
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  name: process.env.SESSION_COOKIE_NAME || 'upivot.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Enhanced User model with indexes
const UserSchema = new mongoose.Schema({
  googleId: { type: String, sparse: true },
  linkedinId: { type: String, sparse: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  picture: String,
  providers: {
    google: {
      id: String,
      email: String
    },
    linkedin: {
      id: String,
      email: String
    }
  },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'providers.google.id': 1 }, { sparse: true });
UserSchema.index({ 'providers.linkedin.id': 1 }, { sparse: true });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

const User = mongoose.model('User', UserSchema);

// Enhanced Drill model with better structure
const DrillSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  tags: [{ type: String, index: true }],
  category: { type: String, index: true },
  estimatedTimeMinutes: { type: Number, default: 30 },
  questions: [{
    question: { type: String, required: true },
    keywords: [String],
    maxScore: { type: Number, default: 20 },
    hints: [String]
  }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for drill queries
DrillSchema.index({ difficulty: 1, isActive: 1 });
DrillSchema.index({ tags: 1, isActive: 1 });
DrillSchema.index({ category: 1, isActive: 1 });
DrillSchema.index({ createdAt: -1 });

const Drill = mongoose.model('Drill', DrillSchema);

// Enhanced Attempt model with better tracking
const AttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  drillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drill', required: true },
  answers: [String],
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  timeSpentMinutes: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Composite index for user attempts with efficient queries
AttemptSchema.index({ userId: 1, completedAt: -1 });
AttemptSchema.index({ drillId: 1, completedAt: -1 });
AttemptSchema.index({ userId: 1, drillId: 1, completedAt: -1 });

const Attempt = mongoose.model('Attempt', AttemptSchema);

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5001/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ 'providers.google.id': profile.id });
      
      if (user) {
        user.lastLoginAt = new Date();
        await user.save();
        return done(null, user);
      }
      
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        user.providers.google = {
          id: profile.id,
          email: profile.emails[0].value
        };
        user.picture = profile.photos[0]?.value || user.picture;
        user.lastLoginAt = new Date();
        await user.save();
        return done(null, user);
      }
      
      user = new User({
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0]?.value || '',
        providers: {
          google: {
            id: profile.id,
            email: profile.emails[0].value
          }
        },
        lastLoginAt: new Date()
      });
      
      await user.save();
      return done(null, user);
    } catch (error) {
      console.error('Error in Google OAuth strategy:', error);
      return done(error, null);
    }
  }));
}

// LinkedIn OAuth Strategy
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: "http://localhost:5001/auth/linkedin/callback",
    scope: ['r_emailaddress', 'r_liteprofile']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ 'providers.linkedin.id': profile.id });
      
      if (user) {
        user.lastLoginAt = new Date();
        await user.save();
        return done(null, user);
      }
      
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found in LinkedIn profile'), null);
      }
      
      user = await User.findOne({ email });
      
      if (user) {
        user.providers.linkedin = {
          id: profile.id,
          email: email
        };
        user.picture = profile.photos?.[0]?.value || user.picture;
        user.lastLoginAt = new Date();
        await user.save();
        return done(null, user);
      }
      
      user = new User({
        email: email,
        name: profile.displayName,
        picture: profile.photos?.[0]?.value || '',
        providers: {
          linkedin: {
            id: profile.id,
            email: email
          }
        },
        lastLoginAt: new Date()
      });
      
      await user.save();
      return done(null, user);
    } catch (error) {
      console.error('Error in LinkedIn OAuth strategy:', error);
      return done(error, null);
    }
  }));
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
};

// Cache helper functions
const getCacheKey = (prefix, key) => `upivot:${prefix}:${key}`;

const getFromCache = async (key) => {
  try {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

const setCache = async (key, data, ttlSeconds = 60) => {
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

// Routes
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    
    // Check Redis connection
    let redisStatus = 'disconnected';
    try {
      await redisClient.ping();
      redisStatus = 'connected';
    } catch (error) {
      redisStatus = 'error';
    }
    
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        cache: redisStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Auth routes
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/?error=auth_failed' }),
  (req, res) => {
    res.redirect('http://localhost:3000/dashboard');
  }
);

app.get('/auth/linkedin', passport.authenticate('linkedin'));

app.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: 'http://localhost:3000/?error=auth_failed' }),
  (req, res) => {
    res.redirect('http://localhost:3000/dashboard');
  }
);

app.post('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: { code: 'LOGOUT_ERROR', message: 'Logout failed' } });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json(req.user);
});

// Drill routes with caching
app.get('/api/drills', async (req, res) => {
  try {
    const cacheKey = getCacheKey('drills', 'all');
    let drills = await getFromCache(cacheKey);
    
    if (!drills) {
      const rawDrills = await Drill.find({ isActive: true })
        .select('title description difficulty tags category estimatedTimeMinutes questions createdAt')
        .sort({ createdAt: -1 })
        .lean(); // Use lean() for better performance
      
      // Transform to include question count but not full questions
      drills = rawDrills.map(drill => ({
        ...drill,
        questionCount: drill.questions?.length || 0,
        questions: undefined // Remove the full questions array
      }));
      
      await setCache(cacheKey, drills, parseInt(process.env.CACHE_TTL_SECONDS) || 60);
    }
    
    res.json(drills);
  } catch (error) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch drills' } });
  }
});

app.get('/api/drills/:id', async (req, res) => {
  try {
    const cacheKey = getCacheKey('drill', req.params.id);
    let drill = await getFromCache(cacheKey);
    
    if (!drill) {
      drill = await Drill.findOne({ _id: req.params.id, isActive: true }).lean();
      if (!drill) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Drill not found' } });
      }
      
      await setCache(cacheKey, drill, parseInt(process.env.CACHE_TTL_SECONDS) || 60);
    }
    
    res.json(drill);
  } catch (error) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch drill' } });
  }
});

// Attempt routes with improved scoring
app.post('/api/attempts', requireAuth, async (req, res) => {
  try {
    const { drillId, answers, timeSpentMinutes = 0 } = req.body;
    
    const drill = await Drill.findOne({ _id: drillId, isActive: true });
    if (!drill) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Drill not found' } });
    }
    
    // Enhanced scoring logic
    let totalScore = 0;
    let maxScore = 0;
    
    for (let i = 0; i < Math.min(answers.length, drill.questions.length); i++) {
      const answer = answers[i].toLowerCase();
      const question = drill.questions[i];
      const keywords = question.keywords;
      const questionMaxScore = question.maxScore || 20;
      
      maxScore += questionMaxScore;
      
      const matchedKeywords = keywords.filter(keyword => 
        answer.includes(keyword.toLowerCase())
      );
      
      // Scoring with partial credit and keyword weighting
      const keywordScore = (matchedKeywords.length / keywords.length) * questionMaxScore;
      
      // Bonus for answer length (shows effort)
      const lengthBonus = Math.min(answer.length / 100, 0.1) * questionMaxScore;
      
      totalScore += Math.min(keywordScore + lengthBonus, questionMaxScore);
    }
    
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    const attempt = new Attempt({
      userId: req.user._id,
      drillId,
      answers,
      score: Math.round(totalScore),
      maxScore,
      percentage,
      timeSpentMinutes: Math.max(0, parseInt(timeSpentMinutes))
    });
    
    await attempt.save();
    
    // Clear user's attempt cache
    const userCacheKey = getCacheKey('user_attempts', req.user._id.toString());
    await redisClient.del(userCacheKey);
    
    res.json(attempt);
  } catch (error) {
    console.error('Error saving attempt:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to save attempt' } });
  }
});

app.get('/api/attempts', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 50); // Max 50 attempts
    const cacheKey = getCacheKey('user_attempts', req.user._id.toString());
    
    let attempts = await getFromCache(cacheKey);
    
    if (!attempts) {
      attempts = await Attempt.find({ userId: req.user._id })
        .populate('drillId', 'title difficulty category')
        .sort({ completedAt: -1 })
        .limit(limit)
        .lean();
      
      await setCache(cacheKey, attempts, 300); // Cache for 5 minutes
    }
    
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch attempts' } });
  }
});

// Analytics endpoint
app.get('/api/analytics', requireAuth, async (req, res) => {
  try {
    console.log('Analytics endpoint called for user:', req.user._id);
    const userId = req.user._id;
    
    const stats = await Attempt.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          bestScore: { $max: '$percentage' },
          totalTimeSpent: { $sum: '$timeSpentMinutes' }
        }
      }
    ]);
    
    console.log('Analytics stats:', stats);
    
    const recentActivity = await Attempt.find({ userId })
      .populate('drillId', 'title difficulty')
      .sort({ completedAt: -1 })
      .limit(10)
      .lean();
    
    console.log('Recent activity count:', recentActivity.length);
    
    const response = {
      stats: stats[0] || { totalAttempts: 0, averageScore: 0, bestScore: 0, totalTimeSpent: 0 },
      recentActivity
    };
    
    console.log('Sending analytics response:', response);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch analytics' } });
  }
});

// Database connection with enhanced configuration
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/upivot', {
  maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE) || 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false
})
  .then(() => {
    console.log('Connected to MongoDB with connection pooling');
    console.log('Database connection established');
    seedData(); // Seed enhanced data
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Enhanced seed data
async function seedData() {
  try {
    console.log('Starting data seeding...');
    const drillCount = await Drill.countDocuments();
    console.log('Current drill count:', drillCount);
    
    // Force re-seed if drills exist but none are active
    const activeCount = await Drill.countDocuments({ isActive: true });
    console.log('Active drill count:', activeCount);
    
    if (drillCount === 0 || activeCount === 0) {
      // Clear existing drills if they're not active
      if (drillCount > 0 && activeCount === 0) {
        await Drill.deleteMany({});
        console.log('Cleared inactive drills');
      }
      const sampleDrills = [
        {
          title: 'JavaScript Fundamentals',
          description: 'Test your knowledge of core JavaScript concepts',
          difficulty: 'Easy',
          tags: ['JavaScript', 'Programming', 'Frontend'],
          category: 'Programming',
          estimatedTimeMinutes: 25,
          isActive: true,
          questions: [
            {
              question: 'What is a closure in JavaScript? Explain with an example.',
              keywords: ['function', 'scope', 'lexical', 'environment', 'variable', 'inner', 'outer'],
              maxScore: 20,
              hints: ['Think about functions inside functions', 'Variables from outer scope']
            },
            {
              question: 'Explain the difference between var, let, and const.',
              keywords: ['hoisting', 'block', 'scope', 'reassignment', 'declaration', 'temporal', 'dead', 'zone'],
              maxScore: 20,
              hints: ['Consider scoping rules', 'Think about reassignment capabilities']
            },
            {
              question: 'What is the event loop in JavaScript? How does it work?',
              keywords: ['asynchronous', 'callback', 'queue', 'stack', 'execution', 'thread', 'non-blocking'],
              maxScore: 20,
              hints: ['Single-threaded nature', 'Call stack and callback queue']
            },
            {
              question: 'What is prototype inheritance? How does it differ from classical inheritance?',
              keywords: ['prototype', 'inheritance', 'object', 'chain', 'constructor', '__proto__', 'classical'],
              maxScore: 20,
              hints: ['Objects inheriting from other objects', 'Prototype chain']
            },
            {
              question: 'Explain async/await vs Promises. When would you use each?',
              keywords: ['asynchronous', 'promise', 'await', 'async', 'then', 'catch', 'syntax', 'sugar'],
              maxScore: 20,
              hints: ['Syntactic sugar for promises', 'Error handling differences']
            }
          ]
        },
        {
          title: 'React Advanced Concepts',
          description: 'Deep dive into advanced React patterns and concepts',
          difficulty: 'Medium',
          tags: ['React', 'Frontend', 'JavaScript', 'Hooks'],
          category: 'Frontend',
          estimatedTimeMinutes: 35,
          isActive: true,
          questions: [
            {
              question: 'What is the virtual DOM and how does React use it for performance?',
              keywords: ['virtual', 'dom', 'reconciliation', 'performance', 'diffing', 'algorithm', 'batch'],
              maxScore: 20,
              hints: ['In-memory representation', 'Efficient updates']
            },
            {
              question: 'Explain React hooks and their rules. What problems do they solve?',
              keywords: ['hooks', 'state', 'effect', 'functional', 'component', 'rules', 'reuse', 'logic'],
              maxScore: 20,
              hints: ['State in functional components', 'Rules of hooks']
            },
            {
              question: 'What is JSX and how does it work under the hood?',
              keywords: ['jsx', 'javascript', 'xml', 'syntax', 'babel', 'createElement', 'transpile'],
              maxScore: 20,
              hints: ['Syntactic sugar', 'Babel transpilation']
            },
            {
              question: 'Explain the component lifecycle in React. How do hooks relate to lifecycle methods?',
              keywords: ['lifecycle', 'mount', 'update', 'unmount', 'render', 'effect', 'cleanup'],
              maxScore: 20,
              hints: ['Class component lifecycle', 'useEffect hook']
            },
            {
              question: 'What are the different approaches to state management in React?',
              keywords: ['state', 'redux', 'context', 'props', 'management', 'zustand', 'local', 'global'],
              maxScore: 20,
              hints: ['Local vs global state', 'Various libraries and patterns']
            }
          ]
        },
        {
          title: 'System Design Fundamentals',
          description: 'Essential concepts for designing scalable systems',
          difficulty: 'Hard',
          tags: ['System Design', 'Architecture', 'Scalability'],
          category: 'System Design',
          estimatedTimeMinutes: 45,
          isActive: true,
          questions: [
            {
              question: 'How would you design a URL shortener like bit.ly? Consider scalability.',
              keywords: ['database', 'scaling', 'encoding', 'base62', 'cache', 'load', 'balancer', 'sharding'],
              maxScore: 20,
              hints: ['Think about URL encoding', 'Database design and scaling']
            },
            {
              question: 'Explain different types of databases and when to use each.',
              keywords: ['sql', 'nosql', 'relational', 'document', 'key-value', 'graph', 'consistency', 'acid'],
              maxScore: 20,
              hints: ['ACID properties', 'CAP theorem']
            },
            {
              question: 'What is caching and what are different caching strategies?',
              keywords: ['cache', 'redis', 'memcached', 'write-through', 'write-back', 'write-around', 'ttl'],
              maxScore: 20,
              hints: ['Different cache levels', 'Cache eviction policies']
            },
            {
              question: 'How would you handle high traffic and ensure system availability?',
              keywords: ['load', 'balancer', 'horizontal', 'scaling', 'redundancy', 'failover', 'circuit', 'breaker'],
              maxScore: 20,
              hints: ['Load distribution', 'Fault tolerance']
            },
            {
              question: 'Explain microservices architecture vs monolithic architecture.',
              keywords: ['microservices', 'monolithic', 'service', 'communication', 'deployment', 'complexity'],
              maxScore: 20,
              hints: ['Trade-offs between approaches', 'Communication patterns']
            }
          ]
        }
      ];
      
      await Drill.insertMany(sampleDrills);
      console.log('Enhanced sample drills seeded');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
