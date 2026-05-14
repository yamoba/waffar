const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Product = require('./models/Product');
const Comparison = require('./models/Comparison');
const AISearch = require('./models/AISearch');
const PriceAlert = require('./models/PriceAlert');

// Import seeder and scraper
const seeder = require('./scrapers/seeder');
const scraperModule = require('./scrapers/index');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));

// Compress all responses for speed
try { const compression = require('compression'); app.use(compression()); } catch(e) {}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
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
    message: { success: false, message: 'Too many auth attempts, please wait 15 minutes.' }
});
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// MongoDB Connection with retry
let dbConnected = false;
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/waffar', {
            serverSelectionTimeoutMS: 8000, socketTimeoutMS: 30000
        });
        dbConnected = true;
        console.log('✓ MongoDB connected');
        await seedDemoUser();
    } catch (err) {
        console.error('✗ MongoDB error:', err.message, '— retrying in 5s');
        setTimeout(connectDB, 5000);
    }
}
connectDB();

function requireDB(req, res, next) {
    if (!dbConnected) return res.status(503).json({ success: false, message: 'Database connecting, please retry.' });
    next();
}

// ===== BACKGROUND SCRAPER JOB =====
let scraperRunning = false;
let lastScraperRun = null;
async function backgroundScraper() {
    if (scraperRunning) return;
    scraperRunning = true;
    try {
        console.log('🔄 Background scraper started...');
        lastScraperRun = new Date();
        // Run all store seeds periodically
        const storeData = seeder.runAll();
        let totalFound = 0, totalSaved = 0;
        for (const { store, products } of storeData) {
            try {
                const productMap = new Map();
                for (const p of products) {
                    const key = p.name;
                    if (productMap.has(key)) {
                        const existing = productMap.get(key);
                        const storeNames = new Set(existing.stores.map(s => s.storeName));
                        for (const store of p.stores) {
                            if (!storeNames.has(store.storeName)) {
                                existing.stores.push(store);
                                storeNames.add(store.storeName);
                            }
                        }
                        existing.lowestPrice = Math.min(existing.lowestPrice, p.lowestPrice);
                    } else {
                        productMap.set(key, p);
                    }
                }
                const merged = Array.from(productMap.values());
                const ops = merged.map(p => ({
                    updateOne: {
                        filter: { name: p.name },
                        update: {
                            $set: {
                                lowestPrice: p.lowestPrice,
                                discount: p.discount,
                                rating: p.rating,
                                reviewCount: p.reviewCount,
                                isTrending: p.isTrending,
                                updatedAt: new Date(),
                            },
                            $addToSet: { stores: { $each: p.stores } },
                            $push: { priceHistory: { $each: p.priceHistory.slice(-1), $slice: -50 } },
                            $setOnInsert: { createdAt: new Date(), views: 0 },
                        },
                        upsert: true,
                    }
                }));
                for (let i = 0; i < ops.length; i += 100) {
                    const r = await Product.bulkWrite(ops.slice(i, i + 100), { ordered: false }).catch(() => ({}));
                    totalSaved += (r.upsertedCount || 0) + (r.modifiedCount || 0);
                }
                totalFound += products.length;
            } catch (e) {
                console.error(`[Scraper] ${store} error:`, e.message);
            }
        }
        console.log(`✓ Scraper completed: ${totalFound} products, ${totalSaved} saved`);
    } catch (e) {
        console.error('[Scraper] Failed:', e.message);
    } finally {
        scraperRunning = false;
    }
}

// Run scraper every 6 hours after first seed
let scraperScheduled = false;
function scheduleBackgroundScraper() {
    if (scraperScheduled) return;
    scraperScheduled = true;
    // First run after 2 hours, then every 6 hours
    setTimeout(() => {
        backgroundScraper();
        setInterval(backgroundScraper, 6 * 60 * 60 * 1000);
    }, 2 * 60 * 60 * 1000);
    console.log('⏱️ Background scraper scheduled (runs every 6 hours)');
}

// Seed demo user on startup
async function seedDemoUser() {
    try {
        const existing = await User.findOne({ email: 'demo@waffar.eg' });
        if (!existing) {
            await User.create({
                name: 'Demo User',
                email: 'demo@waffar.eg',
                password: 'demo123456',
                phone: '+201012345678',
                country: 'Egypt'
            });
            console.log('✓ Demo user created: demo@waffar.eg / demo123456');
        }

        // Auto-seed products if none exist
        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            console.log('⏳ Seeding products from all stores...');
            const storeData = seeder.runAll();
            const allProducts = [];
            for (const { store, products } of storeData) {
                allProducts.push(...products);
            }
            const productMap = new Map();
            for (const p of allProducts) {
                const key = p.name;
                if (productMap.has(key)) {
                    const existing = productMap.get(key);
                    const storeNames = new Set(existing.stores.map(s => s.storeName));
                    for (const store of p.stores) {
                        if (!storeNames.has(store.storeName)) {
                            existing.stores.push(store);
                            storeNames.add(store.storeName);
                        }
                    }
                    existing.lowestPrice = Math.min(existing.lowestPrice, p.lowestPrice);
                } else {
                    productMap.set(key, p);
                }
            }
            const merged = Array.from(productMap.values());
            const result = await Product.insertMany(merged);
            console.log(`✓ Seeded ${result.length} products from ${storeData.length} stores`);
        } else {
            console.log(`✓ ${productCount} products already loaded`);
        }

        // Schedule background scraper
        scheduleBackgroundScraper();
    } catch (err) {
        console.error('Database seed failed:', err.message);
    }
}

// ===== AUTHENTICATION MIDDLEWARE =====
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key'
        );

        req.userId = decoded.id;
        req.user = await User.findById(decoded.id);
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// ===== AUTH ROUTES =====

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, confirmPassword, phone, country } = req.body;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create user
        const user = new User({
            name,
            email,
            password,
            phone: phone || '',
            country: country || 'Egypt'
        });

        await user.save();
        const token = user.getSignedJwtToken();

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                country: user.country
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Signup failed'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                country: user.country,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('wishlist');
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                country: user.country,
                avatar: user.avatar,
                wishlistCount: user.wishlist.length,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone, country, avatar } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                name: name || req.user.name,
                phone: phone || req.user.phone,
                country: country || req.user.country,
                avatar: avatar || req.user.avatar,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                country: user.country,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Update failed'
        });
    }
});

// ===== WISHLIST ROUTES =====

app.post('/api/wishlist', authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body;
        
        const user = await User.findById(req.userId);
        
        if (user.wishlist.includes(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Already in wishlist'
            });
        }

        user.wishlist.push(productId);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Added to wishlist!',
            wishlistCount: user.wishlist.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.delete('/api/wishlist/:productId', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Removed from wishlist!',
            wishlistCount: user.wishlist.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/wishlist', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('wishlist');
        res.status(200).json({
            success: true,
            data: user.wishlist
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== PRODUCT ROUTES =====

app.get('/api/products', requireDB, async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, sort = 'newest', limit = 20, page = 1 } = req.query;
        
        let query = {};
        
        if (search) {
            const _reP = new RegExp(search.replace(/[+?^@{}()|[\]]/g, '\$&'), 'i');
            query = { $or: [{ name: _reP }, { brand: _reP }, { description: _reP }] };
        }
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (minPrice || maxPrice) {
            query.basePrice = {};
            if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
            if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
        }
        
        let sortObj = { createdAt: -1 };
        if (sort === 'price-asc') sortObj = { basePrice: 1 };
        else if (sort === 'price-desc') sortObj = { basePrice: -1 };
        else if (sort === 'popular') sortObj = { rating: -1, createdAt: -1 };
        
        const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        
        const products = await Product.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        const total = await Product.countDocuments(query);
        
        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / Math.max(1, parseInt(limit))),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Products error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/products/deals', requireDB, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 8, 20);
        const products = await Product.find({ discount: { $gt: 0 } })
            .sort({ discount: -1, views: -1 })
            .limit(limit)
            .lean();
        res.json({ success: true, data: products });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/products/trending', requireDB, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 6, 20);
        const products = await Product.find({ $or: [{ isTrending: true }, { views: { $gt: 50 } }] })
            .sort({ views: -1, rating: -1 })
            .limit(limit)
            .lean();
        res.json({ success: true, data: products });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/products/suggestions', requireDB, async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q || q.length < 2) return res.json({ success: true, data: [] });
        const _reSugg = new RegExp(q, 'i');
        const products = await Product.find(
            { $or: [{ name: _reSugg }, { brand: _reSugg }, { category: _reSugg }] },
            { name: 1, category: 1, lowestPrice: 1, basePrice: 1 }
        ).limit(6).lean();
        res.json({ success: true, data: products });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/products/featured', requireDB, async (req, res) => {
    try {
        const products = await Product.find({ isFeatured: true })
            .sort({ rating: -1, reviewCount: -1 })
            .limit(8)
            .lean();
        res.json({ success: true, data: products });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/categories', requireDB, async (req, res) => {
    try {
        const cats = await Product.distinct('category');
        res.json({ success: true, data: (cats || []).sort() });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/products/category/:cat', requireDB, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 12, 50);
        const page = Math.max(parseInt(req.query.page) || 0, 0);
        const products = await Product.find({ category: new RegExp(req.params.cat, 'i') })
            .sort({ isTrending: -1, rating: -1, reviewCount: -1 })
            .skip(page * limit)
            .limit(limit)
            .lean();
        const total = await Product.countDocuments({ category: new RegExp(req.params.cat, 'i') });
        res.json({ success: true, data: products, total, page, limit });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/products/:id', requireDB, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/products', authMiddleware, async (req, res) => {
    try {
        const { name, description, category, basePrice, image, stores } = req.body;
        
        if (!name || !category || !basePrice) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        const product = await Product.create({
            name,
            description,
            category,
            basePrice: parseFloat(basePrice),
            image,
            stores: stores || []
        });
        
        res.status(201).json({
            success: true,
            message: 'Product created',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== COMPARISON ROUTES =====

app.get('/api/comparisons', authMiddleware, async (req, res) => {
    try {
        const comparisons = await Comparison.find({ userId: req.userId })
            .populate('products.productId')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: comparisons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/comparisons', authMiddleware, async (req, res) => {
    try {
        const { productIds, name } = req.body;
        
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Product IDs required'
            });
        }
        
        const comparison = await Comparison.create({
            userId: req.userId,
            products: productIds.map(id => ({ productId: id })),
            name: name || `Comparison ${new Date().toLocaleDateString()}`
        });
        
        await comparison.populate('products.productId');
        
        res.status(201).json({
            success: true,
            message: 'Comparison created',
            data: comparison
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.delete('/api/comparisons/:id', authMiddleware, async (req, res) => {
    try {
        const comparison = await Comparison.findOne({ 
            _id: req.params.id, 
            userId: req.userId 
        });
        
        if (!comparison) {
            return res.status(404).json({
                success: false,
                message: 'Comparison not found'
            });
        }
        
        await Comparison.deleteOne({ _id: req.params.id });
        
        res.status(200).json({
            success: true,
            message: 'Comparison deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== AI SEARCH WITH CLAUDE =====

app.post('/api/ai-search', authMiddleware, requireDB, async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query required'
            });
        }

        // Search in database
        const _reAI = new RegExp(query, 'i');
        const products = await Product.find({
            $or: [{ name: _reAI }, { brand: _reAI }, { description: _reAI }]
        }).limit(10);

        // Try to use Claude API if key exists
        let aiResponse = `Found ${products.length} relevant products for "${query}". `;
        
        try {
            const claudeKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || req.user?.claudeApiKey;
            if (claudeKey) {
                const anthropic = new Anthropic({ apiKey: claudeKey });
                    const response = await anthropic.messages.create({
                        model: 'claude-haiku-4-5-20251001',
                        max_tokens: 500,
                        messages: [{ role: 'user', content: `User is searching for: "${query}". Products: ${products.map(p => p.name).join(', ')}. Recommend the best match in 2-3 sentences.` }]
                    });
                    if (response.content?.[0]?.text) {
                        aiResponse = response.content[0].text;
                    }
            }
        } catch (apiError) {
            console.log('Claude API error (continuing with local search):', apiError.message);
        }

        const aiSearch = await AISearch.create({
            userId: req.userId,
            query,
            results: products.map(p => ({
                productId: p._id,
                relevanceScore: 0.8,
                aiExplanation: `This ${p.category} product matches your search.`
            })),
            aiResponse,
            tokensUsed: 100
        });

        res.status(200).json({
            success: true,
            message: 'Search completed',
            data: {
                query,
                results: products,
                aiResponse,
                searchId: aiSearch._id
            }
        });
    } catch (error) {
        console.error('AI search error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/ai-search-history', authMiddleware, async (req, res) => {
    try {
        const history = await AISearch.find({ userId: req.userId })
            .populate('results.productId')
            .sort({ createdAt: -1 })
            .limit(20);
        
        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/auth/claude-key', authMiddleware, async (req, res) => {
    try {
        const { claudeApiKey } = req.body;
        
        if (!claudeApiKey) {
            return res.status(400).json({
                success: false,
                message: 'API key required'
            });
        }
        
        await User.findByIdAndUpdate(req.userId, { claudeApiKey });
        
        res.status(200).json({
            success: true,
            message: 'API key saved!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== DEMO ROUTES =====

app.post('/api/demo/add-products', async (req, res) => {
    try {
        const existingCount = await Product.countDocuments();
        if (existingCount > 0) {
            return res.status(200).json({ success: true, message: `${existingCount} products already loaded` });
        }

        const storeData = seeder.runAll();
        const allProducts = [];
        for (const { store, products } of storeData) {
            allProducts.push(...products);
        }

        const productMap = new Map();
        for (const p of allProducts) {
            const key = p.name;
            if (productMap.has(key)) {
                const existing = productMap.get(key);
                const storeNames = new Set(existing.stores.map(s => s.storeName));
                for (const store of p.stores) {
                    if (!storeNames.has(store.storeName)) {
                        existing.stores.push(store);
                        storeNames.add(store.storeName);
                    }
                }
                existing.lowestPrice = Math.min(existing.lowestPrice, p.lowestPrice);
            } else {
                productMap.set(key, p);
            }
        }

        const merged = Array.from(productMap.values());
        const inserted = await Product.insertMany(merged);
        res.status(201).json({ success: true, message: `${inserted.length} products loaded from ${storeData.length} stores!`, data: inserted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// ===== NEW PRODUCT ROUTES =====

app.get('/api/products/:id/history', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id, { priceHistory: 1, name: 1 }).lean();
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: product.priceHistory || [] });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/products/:id/view', async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.json({ success: true });
    } catch(e) { res.json({ success: false }); }
});

// ===== PRICE ALERT ROUTES =====

app.post('/api/alerts', authMiddleware, async (req, res) => {
    try {
        const { productName, targetPrice, productId } = req.body;
        if (!productName || !targetPrice) {
            return res.status(400).json({ success: false, message: 'productName and targetPrice are required' });
        }
        const alert = await PriceAlert.create({
            userId: req.userId,
            productName,
            targetPrice: parseFloat(targetPrice),
            productId: productId || null
        });
        res.status(201).json({ success: true, message: 'Price alert created', data: alert });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/alerts', authMiddleware, async (req, res) => {
    try {
        const alerts = await PriceAlert.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: alerts });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/alerts/:id', authMiddleware, async (req, res) => {
    try {
        const alert = await PriceAlert.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
        res.json({ success: true, message: 'Alert deleted' });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/alerts/:id', authMiddleware, async (req, res) => {
    try {
        const { isActive, targetPrice } = req.body;
        const update = {};
        if (isActive !== undefined) update.isActive = isActive;
        if (targetPrice) update.targetPrice = parseFloat(targetPrice);
        const alert = await PriceAlert.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            update,
            { new: true }
        );
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
        res.json({ success: true, data: alert });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// ===== USER STATS =====

app.get('/api/auth/stats', authMiddleware, async (req, res) => {
    try {
        const [user, comparisonsCount, alertsCount, searchesCount, wishlistItems] = await Promise.all([
            User.findById(req.userId),
            Comparison.countDocuments({ userId: req.userId }),
            PriceAlert.countDocuments({ userId: req.userId, isActive: true }),
            AISearch.countDocuments({ userId: req.userId }),
            user ? Product.find({ _id: { $in: user.wishlist || [] } }).select('name lowestPrice basePrice image').lean() : Promise.resolve([])
        ]);
        const totalSavings = (wishlistItems || []).reduce((sum, p) => sum + Math.max(0, (p.basePrice || p.lowestPrice) - (p.lowestPrice || 0)), 0);
        res.json({
            success: true,
            data: {
                user: { name: user?.name, email: user?.email, avatar: user?.avatar },
                wishlistCount: user?.wishlist?.length || 0,
                wishlistItems: wishlistItems || [],
                comparisonsCount,
                alertsCount,
                searchesCount,
                estimatedSavings: Math.round(totalSavings),
                lastLogin: user?.lastLogin
            }
        });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/dashboard/summary', authMiddleware, async (req, res) => {
    try {
        const [alertsCount, activeAlerts, topSavings, recentSearches] = await Promise.all([
            PriceAlert.countDocuments({ userId: req.userId }),
            PriceAlert.find({ userId: req.userId, isActive: true }).limit(5).lean(),
            Product.find({ _id: { $in: await Comparison.distinct('products', { userId: req.userId }) } }).sort({ discount: -1 }).limit(3).lean(),
            AISearch.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(5).select('query createdAt').lean()
        ]);
        res.json({
            success: true,
            data: {
                alertsCount,
                activeAlerts: activeAlerts.map(a => ({ id: a._id, productName: a.productName, targetPrice: a.targetPrice })),
                topSavingsProducts: topSavings,
                recentSearches
            }
        });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});


// ===== SCRAPER ROUTES =====

const scraper = require('./scrapers/index');

// Run all scrapers (or specific sites)
app.post('/api/scrape/run', async (req, res) => {
    try {
        const { sites, concurrency } = req.body || {};
        if (scraper.getStatus().isRunning) {
            return res.status(409).json({ success: false, message: 'A scrape is already in progress' });
        }
        const allSites = scraper.ALL_SITES || Object.keys(scraper.scrapers);
        res.json({ success: true, message: 'Scrape started', sites: sites || allSites });
        scraper.runAll(sites || null, concurrency || 2).catch(e => console.error('[Scrape] runAll error:', e.message));
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Run a single site scraper
app.post('/api/scrape/sites/:site', async (req, res) => {
    try {
        const { site } = req.params;
        if (!scraper.scrapers[site]) {
            return res.status(404).json({ success: false, message: `Unknown site: ${site}` });
        }
        res.json({ success: true, message: `Scraping ${site}...` });
        scraper.runSite(site).catch(e => console.error(`[Scrape] ${site} error:`, e.message));
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Get scrape status
app.get('/api/scrape/status', (req, res) => {
    res.json({ success: true, ...scraper.getStatus() });
});

// List available scrapers
app.get('/api/scrape/sites', (req, res) => {
    res.json({ success: true, sites: scraper.ALL_SITES || Object.keys(scraper.scrapers) });
});

// ===== PRODUCT MULTI-STORE COMPARISON =====

// Get all stores selling a product by name (fuzzy)
app.get('/api/products/:id/stores', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        const stores = (product.stores || []).sort((a, b) => a.price - b.price);
        res.json({ success: true, data: { product: { _id: product._id, name: product.name, image: product.image }, stores } });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// Find similar products (same category, comparable price)
app.get('/api/products/:id/similar', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        const similar = await Product.find({
            _id: { $ne: product._id },
            category: product.category,
            lowestPrice: { $gte: product.lowestPrice * 0.5, $lte: product.lowestPrice * 2 }
        }).limit(8).sort({ discount: -1 });
        res.json({ success: true, data: similar });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// ===== SCHEDULED AUTO-SCRAPE =====
// Runs once on startup (if DB is empty) and every 24h
let autoScrapeTimer = null;

async function scheduleAutoScrape() {
    try {
        const count = await Product.countDocuments();
        if (count < 50) {
            console.log(`[AutoScrape] Only ${count} products — seeding now...`);
            const scraper = require('./scrapers/index');
            await scraper.runAll(null, 2);
        } else {
            console.log(`[AutoScrape] ${count} products in DB — skipping startup seed`);
        }
    } catch(e) { console.error('[AutoScrape] startup seed error:', e.message); }

    // Schedule re-scrape every 24h
    const MS_24H = 24 * 60 * 60 * 1000;
    autoScrapeTimer = setTimeout(async function repeat() {
        console.log('[AutoScrape] Running scheduled 24h scrape...');
        try {
            const scraper = require('./scrapers/index');
            if (!scraper.getStatus().isRunning) await scraper.runAll(null, 2);
        } catch(e) { console.error('[AutoScrape] error:', e.message); }
        autoScrapeTimer = setTimeout(repeat, MS_24H);
    }, MS_24H);
}

// Trigger auto-scrape after DB connects (give mongoose 2s to connect)
setTimeout(() => {
    if (mongoose.connection.readyState === 1) scheduleAutoScrape();
    else mongoose.connection.once('connected', scheduleAutoScrape);
}, 2000);

// ===== HEALTH CHECK =====

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ===== ERROR HANDLING =====

// ===== SERVE FRONTEND =====
const path = require('path');
const FRONTEND = path.join(__dirname, 'public');
app.use(express.static(FRONTEND));
app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'index.html'));
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found', path: req.path });
});

app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});



// ===== START SERVER =====

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nServer running on http://localhost:${PORT}`);
    console.log(`Auth:      /api/auth/*`);
    console.log(`Products:  /api/products`);
    console.log(`Deals:     /api/products/deals`);
    console.log(`Trending:  /api/products/trending`);
    console.log(`Alerts:    /api/alerts`);
    console.log(`AI Search: /api/ai-search`);
    console.log(`Stats:     /api/auth/stats`);
    console.log(`Health:    /api/health\n`);
});

process.on('SIGTERM', () => {
    server.close(() => { mongoose.connection.close(); process.exit(0); });
});

module.exports = app;