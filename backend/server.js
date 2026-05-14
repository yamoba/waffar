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

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true
}));

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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/waffar')
.then(async () => { console.log('✓ MongoDB connected'); await seedDemoUser(); })
.catch(err => {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
});

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
    } catch (err) {
        console.error('Demo user seed failed:', err.message);
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

app.get('/api/products', async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, sort = 'newest', limit = 20, page = 1 } = req.query;
        
        let query = {};
        
        if (search) {
            query = { $text: { $search: search } };
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

app.get('/api/products/deals', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 8, 20);
        const products = await Product.find({ discount: { $gt: 0 } })
            .sort({ discount: -1, views: -1 })
            .limit(limit)
            .lean();
        res.json({ success: true, data: products });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/products/trending', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 6, 20);
        const products = await Product.find({ $or: [{ isTrending: true }, { views: { $gt: 50 } }] })
            .sort({ views: -1, rating: -1 })
            .limit(limit)
            .lean();
        res.json({ success: true, data: products });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/products/suggestions', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q || q.length < 2) return res.json({ success: true, data: [] });
        const products = await Product.find(
            { $text: { $search: q } },
            { name: 1, category: 1, lowestPrice: 1, basePrice: 1 }
        ).limit(6).lean();
        res.json({ success: true, data: products.map(p => ({ _id: p._id, name: p.name, category: p.category, price: p.lowestPrice || p.basePrice })) });
    } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});
app.get('/api/products/:id', async (req, res) => {
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

app.post('/api/ai-search', authMiddleware, async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query required'
            });
        }

        // Search in database
        const products = await Product.find({
            $text: { $search: query }
        }).limit(10);

        // Try to use Claude API if key exists
        let aiResponse = `Found ${products.length} relevant products for "${query}". `;
        
        try {
            const claudeKey = req.user.claudeApiKey || process.env.CLAUDE_API_KEY;
            if (claudeKey) {
                const anthropic = new Anthropic({ apiKey: claudeKey });
                    const response = await anthropic.messages.create({
                        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
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

        const now = new Date();
        const sampleProducts = [
            { name: 'Apple iPhone 15 Pro 256GB', brand: 'Apple', category: 'Phones', basePrice: 22999, discount: 5, rating: 4.8, reviews: 1250, isTrending: true, tags: ['phone','iphone','apple','5g'], description: 'Latest iPhone with titanium design, A17 Pro chip, and 48MP camera system.', stores: [{ store: 'Amazon Egypt', price: 22999, inStock: true }, { store: 'Noon', price: 23499, inStock: true }, { store: 'Jumia', price: 22499, inStock: true }] },
            { name: 'Samsung Galaxy S24 Ultra 512GB', brand: 'Samsung', category: 'Phones', basePrice: 24999, discount: 8, rating: 4.7, reviews: 890, isTrending: true, tags: ['samsung','phone','android','s-pen'], description: 'Premium Android phone with built-in S Pen and 200MP camera.', stores: [{ store: 'Amazon Egypt', price: 24999, inStock: true }, { store: 'Noon', price: 25499, inStock: false }, { store: 'Jumia', price: 24499, inStock: true }] },
            { name: 'MacBook Air M3 13-inch', brand: 'Apple', category: 'Laptops', basePrice: 32999, discount: 3, rating: 4.9, reviews: 580, isNew: true, tags: ['macbook','apple','laptop','m3'], description: 'Incredibly thin and fast laptop with Apple M3 chip and all-day battery.', stores: [{ store: 'Amazon Egypt', price: 32999, inStock: true }, { store: 'iStyle Egypt', price: 33500, inStock: true }] },
            { name: 'Dell XPS 15 9530', brand: 'Dell', category: 'Laptops', basePrice: 28500, discount: 10, rating: 4.6, reviews: 340, tags: ['dell','laptop','windows','oled'], description: 'Premium Windows laptop with OLED display and Intel Core i7.', stores: [{ store: 'Amazon Egypt', price: 28500, inStock: true }, { store: 'Noon', price: 29000, inStock: true }, { store: 'Carrefour', price: 27999, inStock: true }] },
            { name: 'Sony WH-1000XM5 Headphones', brand: 'Sony', category: 'Audio', basePrice: 4999, discount: 15, rating: 4.9, reviews: 2100, isFeatured: true, tags: ['headphones','sony','noise-cancelling','wireless'], description: 'Industry-leading noise cancelling with 30-hour battery and premium sound.', stores: [{ store: 'Amazon Egypt', price: 4999, inStock: true }, { store: 'Noon', price: 5299, inStock: true }, { store: 'Jumia', price: 4799, inStock: true }] },
            { name: 'Samsung 65" 4K QLED TV QN90C', brand: 'Samsung', category: 'Electronics', basePrice: 18999, discount: 12, rating: 4.7, reviews: 430, isFeatured: true, tags: ['samsung','tv','4k','qled','smart-tv'], description: 'Quantum dot technology with Neo Quantum Processor and ultra-bright display.', stores: [{ store: 'Jumia', price: 18999, inStock: true }, { store: 'Carrefour', price: 19499, inStock: true }, { store: 'Amazon Egypt', price: 18499, inStock: false }] },
        ];
        const sampleProducts2 = [
            { name: 'PlayStation 5 Console', brand: 'Sony', category: 'Gaming', basePrice: 15999, discount: 0, rating: 4.8, reviews: 3200, isTrending: true, tags: ['ps5','playstation','gaming','console'], description: 'Next-gen gaming with ultra-high speed SSD and DualSense controller.', stores: [{ store: 'Amazon Egypt', price: 15999, inStock: true }, { store: 'Jumia', price: 16299, inStock: false }, { store: 'Noon', price: 15799, inStock: true }] },
            { name: 'ASUS ROG Gaming Laptop G15', brand: 'ASUS', category: 'Gaming', basePrice: 21999, discount: 7, rating: 4.6, reviews: 280, tags: ['asus','rog','gaming','laptop','rtx'], description: 'High-performance gaming laptop with RTX 4060 and 165Hz display.', stores: [{ store: 'Amazon Egypt', price: 21999, inStock: true }, { store: 'Noon', price: 22500, inStock: true }] },
            { name: 'Nike Air Max 270 React', brand: 'Nike', category: 'Sports', basePrice: 1299, discount: 20, rating: 4.5, reviews: 780, tags: ['nike','shoes','running','sports'], description: 'Lightweight running shoes with Air Max cushioning technology.', stores: [{ store: 'Amazon Egypt', price: 1299, inStock: true }, { store: 'Jumia', price: 1199, inStock: true }, { store: 'Noon', price: 1349, inStock: true }] },
            { name: 'LG Washing Machine 8kg TurboWash', brand: 'LG', category: 'Home Appliances', basePrice: 8999, discount: 5, rating: 4.4, reviews: 520, tags: ['washing-machine','lg','home-appliance'], description: 'Front load washing machine with AI Direct Drive motor and steam wash.', stores: [{ store: 'Carrefour', price: 8999, inStock: true }, { store: 'Amazon Egypt', price: 8699, inStock: true }] },
            { name: 'Dyson V12 Detect Slim', brand: 'Dyson', category: 'Home Appliances', basePrice: 7499, discount: 8, rating: 4.8, reviews: 310, isFeatured: true, tags: ['dyson','vacuum','cordless','cleaning'], description: 'Laser dust detection and intelligent suction for perfect cleaning.', stores: [{ store: 'Amazon Egypt', price: 7499, inStock: true }, { store: 'Noon', price: 7799, inStock: true }] },
            { name: 'Philips Air Fryer XXL 7.3L', brand: 'Philips', category: 'Home Appliances', basePrice: 2799, discount: 15, rating: 4.6, reviews: 1100, tags: ['airfryer','philips','cooking','kitchen'], description: 'XL family-sized air fryer with fat removal technology.', stores: [{ store: 'Carrefour', price: 2799, inStock: true }, { store: 'Amazon Egypt', price: 2699, inStock: true }, { store: 'Jumia', price: 2599, inStock: true }] },
        ];
        const sampleProducts3 = [
            { name: 'Apple iPad Pro 12.9" M2', brand: 'Apple', category: 'Tablets', basePrice: 18999, discount: 5, rating: 4.8, reviews: 420, tags: ['ipad','apple','tablet','m2'], description: 'ProMotion XDR display with Apple M2 chip and Liquid Retina XDR.', stores: [{ store: 'Amazon Egypt', price: 18999, inStock: true }, { store: 'Noon', price: 19499, inStock: true }] },
            { name: 'Nespresso Vertuo Next Coffee Machine', brand: 'Nespresso', category: 'Home Appliances', basePrice: 2999, discount: 10, rating: 4.7, reviews: 890, tags: ['coffee','nespresso','machine','kitchen'], description: 'One touch coffee machine with centrifusion brewing technology.', stores: [{ store: 'Amazon Egypt', price: 2999, inStock: true }, { store: 'Carrefour', price: 3199, inStock: true }] },
            { name: 'Samsung Galaxy Watch 6 44mm', brand: 'Samsung', category: 'Watches', basePrice: 4299, discount: 12, rating: 4.5, reviews: 560, tags: ['smartwatch','samsung','wearable','health'], description: 'Advanced health monitoring with body composition and sleep tracking.', stores: [{ store: 'Amazon Egypt', price: 4299, inStock: true }, { store: 'Noon', price: 4499, inStock: true }, { store: 'Jumia', price: 4199, inStock: true }] },
            { name: 'Anker Soundcore Life Q35 Headphones', brand: 'Anker', category: 'Audio', basePrice: 899, discount: 10, rating: 4.4, reviews: 2300, isFeatured: true, tags: ['headphones','anker','wireless','budget'], description: 'Multi-mode ANC headphones with LDAC Hi-Res audio at a great price.', stores: [{ store: 'Amazon Egypt', price: 899, inStock: true }, { store: 'Jumia', price: 849, inStock: true }] },
            { name: 'L\'Oreal Revitalift Triple Power Serum', brand: "L'Oreal", category: 'Beauty', basePrice: 599, discount: 20, rating: 4.6, reviews: 1800, tags: ['serum','loreal','skincare','beauty'], description: 'Powered by Pro-Retinol, Vitamin C and Hyaluronic Acid for youthful skin.', stores: [{ store: 'Amazon Egypt', price: 599, inStock: true }, { store: 'Carrefour', price: 629, inStock: true }] },
            { name: 'Adidas Ultraboost 22 Running Shoes', brand: 'Adidas', category: 'Sports', basePrice: 1599, discount: 15, rating: 4.7, reviews: 950, tags: ['adidas','shoes','ultraboost','running'], description: 'Responsive running shoes with BOOST midsole for energy return.', stores: [{ store: 'Amazon Egypt', price: 1599, inStock: true }, { store: 'Jumia', price: 1499, inStock: true }, { store: 'Noon', price: 1649, inStock: true }] },
        ];

        const all = [...sampleProducts, ...sampleProducts2, ...sampleProducts3].map(p => ({
            ...p,
            lowestPrice: Math.min(...(p.stores || []).map(s => s.price).filter(Boolean), p.basePrice),
            priceHistory: [{ price: p.basePrice, store: 'base', date: new Date(now - 30*24*60*60*1000) }, { price: Math.round(p.basePrice * 1.05), store: 'base', date: new Date(now - 15*24*60*60*1000) }, { price: p.lowestPrice || p.basePrice, store: 'base', date: now }]
        }));

        const inserted = await Product.insertMany(all);
        res.status(201).json({ success: true, message: `${inserted.length} products loaded!`, data: inserted });
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
        const [user, comparisonsCount, alertsCount, searchesCount] = await Promise.all([
            User.findById(req.userId),
            Comparison.countDocuments({ userId: req.userId }),
            PriceAlert.countDocuments({ userId: req.userId, isActive: true }),
            AISearch.countDocuments({ userId: req.userId })
        ]);
        res.json({
            success: true,
            data: {
                wishlistCount: user?.wishlist?.length || 0,
                comparisonsCount,
                alertsCount,
                searchesCount
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
// DEBUG — remove after fixing
app.get('/debug', (req, res) => {
    const fs = require('fs');
    const publicPath = path.join(__dirname, 'public');
    let files = [];
    try { files = fs.readdirSync(publicPath); } catch(e) { files = ['ERROR: ' + e.message]; }
    res.json({
        __dirname,
        publicPath,
        publicExists: fs.existsSync(publicPath),
        files,
        cwd: process.cwd()
    });
});
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