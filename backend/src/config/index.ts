export const config = {
  port: parseInt(process.env.PORT || "4000"),
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: process.env.NODE_ENV !== "production",

  database: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
    expiry: process.env.JWT_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || "12"),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback",
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    accessKey: process.env.S3_ACCESS_KEY || "waffar_minio",
    secretKey: process.env.S3_SECRET_KEY || "waffar_minio_secret",
    bucket: process.env.S3_BUCKET || "waffar-images",
    region: process.env.S3_REGION || "us-east-1",
  },

  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || "http://localhost:5000",
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY || "",
    from: process.env.EMAIL_FROM || "noreply@waffar.co",
  },

  rateLimit: {
    anonymous: 100,
    authenticated: 300,
    windowMs: 60_000,
  },

  scraper: {
    concurrency: parseInt(process.env.SCRAPER_CONCURRENCY || "5"),
    timeoutMs: parseInt(process.env.SCRAPER_TIMEOUT || "30000"),
  },

  security: {
    corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001,https://waffar.eg,https://www.waffar.eg")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    internalApiKey: process.env.INTERNAL_API_KEY || "",
  },

  features: {
    aggressiveScraping: process.env.FEATURE_AGGRESSIVE_SCRAPING === "true",
    notifications: process.env.FEATURE_NOTIFICATIONS !== "false",
    affiliateTracking: process.env.FEATURE_AFFILIATE_TRACKING !== "false",
    semanticMatching: process.env.FEATURE_SEMANTIC_MATCHING !== "false",
  },
} as const;
