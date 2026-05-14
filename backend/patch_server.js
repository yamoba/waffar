const fs = require('fs');
let c = fs.readFileSync('c:/Users/Legion/Documents/main/backend/server.js', 'utf8');

c = c.replace(
  "const jwt = require('jsonwebtoken');",
  "const jwt = require('jsonwebtoken');\nconst rateLimit = require('express-rate-limit');\nconst Anthropic = require('@anthropic-ai/sdk');"
);

c = c.replace(
  ".then(() => console.log('✓ MongoDB connected'))",
  ".then(async () => { console.log('✓ MongoDB connected'); await seedDemoUser(); })"
);

const rateLimitCode = `// Rate limiting
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { success: false, message: 'Too many requests, try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many auth attempts, try again in 15 minutes.' }
});
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

`;
c = c.replace('// Request logging', rateLimitCode + '// Request logging');

fs.writeFileSync('c:/Users/Legion/Documents/main/backend/server.js', c, 'utf8');
console.log('Has rateLimit:', c.includes('express-rate-limit'));
console.log('Has Anthropic:', c.includes('@anthropic-ai/sdk'));
console.log('Has seedDemoUser call:', c.includes('await seedDemoUser'));
console.log('Has rate middleware:', c.includes("app.use('/api', apiLimiter)"));