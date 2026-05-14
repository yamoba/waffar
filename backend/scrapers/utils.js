'use strict';
const axios = require('axios');
const cheerio = require('cheerio');

// ===== USER AGENT POOL =====
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15'
];

const getRandomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

// ===== RATE LIMITER =====
class RateLimiter {
    constructor(requestsPerSecond = 1) {
        this.interval = 1000 / requestsPerSecond;
        this.queue = [];
        this.running = false;
    }

    async throttle() {
        return new Promise(resolve => {
            this.queue.push(resolve);
            if (!this.running) this._process();
        });
    }

    _process() {
        this.running = true;
        const next = this.queue.shift();
        if (!next) { this.running = false; return; }
        next();
        setTimeout(() => this._process(), this.interval + Math.random() * 500);
    }
}

// Shared limiters — 1 request/2s per domain by default
const limiters = {};
const getLimiter = (domain) => {
    if (!limiters[domain]) limiters[domain] = new RateLimiter(0.5);
    return limiters[domain];
};

// ===== HTTP CLIENT =====
async function fetchJson(url, options = {}) {
    const domain = new URL(url).hostname;
    await getLimiter(domain).throttle();

    const config = {
        url,
        method: options.method || 'GET',
        headers: {
            'User-Agent': getRandomUA(),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            ...options.headers
        },
        timeout: options.timeout || 15000,
        params: options.params
    };

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = await axios(config);
            return res.data;
        } catch (err) {
            const status = err.response?.status;
            if (status === 403 || status === 429) {
                if (attempt < 3) {
                    await sleep(3000 * attempt);
                    continue;
                }
            }
            if (attempt === 3) throw err;
            await sleep(2000 * attempt);
        }
    }
}

async function fetchHtml(url, options = {}) {
    const domain = new URL(url).hostname;
    await getLimiter(domain).throttle();

    const config = {
        url,
        method: 'GET',
        headers: {
            'User-Agent': getRandomUA(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            ...options.headers
        },
        timeout: options.timeout || 20000,
        params: options.params,
        responseType: 'text'
    };

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = await axios(config);
            return cheerio.load(res.data);
        } catch (err) {
            if (attempt === 3) throw err;
            await sleep(2500 * attempt);
        }
    }
}

// ===== UTILITIES =====
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function parsePrice(str) {
    if (!str) return 0;
    const n = parseFloat(String(str).replace(/[^\d.]/g, ''));
    return isNaN(n) ? 0 : n;
}

function cleanText(str) {
    if (!str) return '';
    return String(str).replace(/\s+/g, ' ').trim();
}

function normalizeProduct({ name, price, originalPrice, discount, image, url, store, storeName, category, brand, rating, reviewCount, inStock, description }) {
    if (!name || !price || price <= 0) return null;

    const storeEntry = {
        store: storeName || store || 'Unknown',
        storeName: storeName || store || 'Unknown',
        price: parsePrice(price),
        url: url || '#',
        inStock: inStock !== false
    };

    const disc = discount ? parseFloat(discount) :
        (originalPrice && originalPrice > price
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : 0);

    return {
        name: cleanText(name),
        description: cleanText(description) || '',
        brand: cleanText(brand) || '',
        category: mapCategory(category),
        basePrice: parsePrice(price),
        lowestPrice: parsePrice(price),
        discount: Math.min(Math.max(disc, 0), 99),
        image: image || null,
        stores: [storeEntry],
        rating: rating ? Math.min(parseFloat(rating), 5) : 4.0,
        reviews: reviewCount ? parseInt(reviewCount) : 0,
        reviewCount: reviewCount ? parseInt(reviewCount) : 0,
        tags: [],
        isTrending: false,
        isNew: false
    };
}

const CATEGORY_MAP = {
    'phones': 'Phones', 'mobile': 'Phones', 'smartphone': 'Phones', 'iphone': 'Phones',
    'laptop': 'Laptops', 'laptops': 'Laptops', 'notebook': 'Laptops',
    'tv': 'Electronics', 'television': 'Electronics', 'screen': 'Electronics',
    'electronics': 'Electronics', 'computer': 'Electronics', 'tablet': 'Tablets', 'tablets': 'Tablets',
    'gaming': 'Gaming', 'game': 'Gaming', 'playstation': 'Gaming', 'xbox': 'Gaming',
    'headphone': 'Audio', 'speaker': 'Audio', 'audio': 'Audio', 'earphone': 'Audio',
    'camera': 'Cameras', 'cameras': 'Cameras', 'photography': 'Cameras',
    'watch': 'Watches', 'watches': 'Watches', 'smartwatch': 'Watches',
    'fashion': 'Fashion', 'clothing': 'Fashion', 'clothes': 'Fashion', 'apparel': 'Fashion',
    'shoes': 'Fashion', 'footwear': 'Fashion', 'bags': 'Fashion',
    'home': 'Home & Garden', 'garden': 'Home & Garden', 'furniture': 'Home & Garden',
    'appliance': 'Home Appliances', 'refrigerator': 'Home Appliances', 'washing': 'Home Appliances',
    'sports': 'Sports', 'fitness': 'Sports', 'gym': 'Sports',
    'beauty': 'Beauty', 'skincare': 'Beauty', 'makeup': 'Beauty', 'perfume': 'Beauty',
    'food': 'Food', 'grocery': 'Food',
    'books': 'Books', 'book': 'Books'
};

function mapCategory(raw) {
    if (!raw) return 'Other';
    const lower = String(raw).toLowerCase();
    for (const [key, val] of Object.entries(CATEGORY_MAP)) {
        if (lower.includes(key)) return val;
    }
    return 'Other';
}

// Search keywords per category — keys are lowercase for dot-notation access in scrapers
const SEARCH_QUERIES = {
    phones:        ['iphone', 'samsung galaxy', 'redmi', 'oppo', 'realme', 'huawei mobile'],
    laptops:       ['laptop', 'macbook', 'dell laptop', 'lenovo laptop', 'hp laptop', 'asus laptop'],
    tvs:           ['smart tv', 'samsung tv', 'lg tv', 'tcl tv', 'television 55 inch', 'oled tv'],
    gaming:        ['playstation 5', 'xbox series', 'gaming laptop', 'gaming chair', 'gaming headset', 'nintendo switch'],
    audio:         ['headphones', 'earbuds', 'bluetooth speaker', 'airpods', 'soundbar'],
    appliances:    ['washing machine', 'refrigerator', 'air conditioner', 'dishwasher', 'microwave', 'oven'],
    furniture:     ['sofa', 'bed frame', 'dining table', 'office desk', 'wardrobe'],
    homeAppliances:['washing machine', 'vacuum cleaner', 'air purifier', 'water heater', 'coffee maker'],
    fashion:       ['mens jacket', 'womens dress', 'jeans', 'hoodie', 'sportswear', 'coat'],
    shoes:         ['sneakers', 'running shoes', 'sandals', 'boots', 'loafers'],
    tablets:       ['ipad', 'samsung tab', 'android tablet', 'drawing tablet'],
    cameras:       ['dslr camera', 'mirrorless camera', 'action camera', 'camera lens', 'gopro'],
    watches:       ['smartwatch', 'casio watch', 'apple watch', 'samsung watch', 'huawei watch'],
    beauty:        ['perfume', 'face cream', 'foundation', 'shampoo', 'moisturizer', 'lipstick'],
    sports:        ['protein powder', 'yoga mat', 'fitness tracker', 'bicycle', 'gym bag'],
    books:         ['novel', 'programming book', 'self help book', 'arabic novel', 'textbook'],
    grocery:       ['rice', 'cooking oil', 'mineral water', 'coffee', 'detergent', 'sugar', 'flour']
};

module.exports = { fetchJson, fetchHtml, sleep, parsePrice, cleanText, normalizeProduct, mapCategory, SEARCH_QUERIES, getLimiter };