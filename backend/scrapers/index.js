'use strict';
const Product = require('../models/Product');
const seeder  = require('./seeder');

// Simple concurrency limiter (replaces p-limit which is ESM-only in v7)
function pLimit(concurrency) {
    let active = 0;
    const queue = [];
    const next = () => {
        if (active >= concurrency || !queue.length) return;
        active++;
        const { fn, resolve, reject } = queue.shift();
        fn().then(r => { active--; resolve(r); next(); }).catch(e => { active--; reject(e); next(); });
    };
    return fn => new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); next(); });
}

// Only scrapers that are confirmed to work live
const LIVE_SCRAPERS = {
    jumia:  require('./sites/jumia'),
    amazon: require('./sites/amazon'),
};

// Expose all scraper names for the UI
const ALL_SITES = [
    'jumia', 'amazon', 'noon', 'carrefour', 'btech', '2b', 'elaraby',
    'raneen', 'homzmart', 'namshi', 'ikea', 'hm', 'extra', 'radioshack', 'tradeline'
];

// In-memory status
const STATUS = {
    isRunning:   false,
    startedAt:   null,
    completedAt: null,
    totalFound:  0,
    totalSaved:  0,
    errors:      [],
    sites:       {},
};

function getStatus() { return { ...STATUS, sites: { ...STATUS.sites } }; }

// ── DB upsert ──────────────────────────────────────────────────────────────
async function upsertProducts(products) {
    if (!products.length) return 0;

    const ops = products.map(p => ({
        updateOne: {
            filter: { name: p.name },
            update: {
                $set: {
                    description: p.description || '',
                    brand:       p.brand       || '',
                    category:    p.category,
                    image:       p.image,
                    discount:    p.discount,
                    lowestPrice: p.lowestPrice || p.basePrice,
                    isTrending:  p.isTrending  || false,
                    isNew:       p.isNew       || false,
                    rating:      p.rating,
                    reviewCount: p.reviewCount,
                    tags:        p.tags        || [],
                    updatedAt:   new Date(),
                },
                $addToSet: { stores: { $each: p.stores || [] } },
                $push: {
                    priceHistory: {
                        $each:  (p.priceHistory || []).slice(-3),
                        $slice: -50,
                    }
                },
                $setOnInsert: { createdAt: new Date(), views: 0 },
            },
            upsert: true,
        }
    }));

    let saved = 0;
    for (let i = 0; i < ops.length; i += 100) {
        try {
            const r = await Product.bulkWrite(ops.slice(i, i + 100), { ordered: false });
            saved += (r.upsertedCount || 0) + (r.modifiedCount || 0);
        } catch (e) {
            // Ignore duplicate-key errors from bulk
            if (!e.message.includes('duplicate')) console.error('[DB]', e.message);
        }
    }
    return saved;
}

// ── Run a single live scraper ──────────────────────────────────────────────
async function runLiveSite(siteName) {
    const scraper = LIVE_SCRAPERS[siteName];
    if (!scraper) throw new Error(`No live scraper for: ${siteName}`);

    STATUS.sites[siteName] = { status: 'running', startedAt: new Date(), found: 0, saved: 0, error: null };
    try {
        const { products } = await scraper.run();
        const saved = await upsertProducts(products);
        STATUS.sites[siteName] = { status: 'done', startedAt: STATUS.sites[siteName].startedAt, completedAt: new Date(), found: products.length, saved, error: null };
        STATUS.totalFound += products.length;
        STATUS.totalSaved += saved;
        console.log(`[Scraper] ${siteName}: ${products.length} found, ${saved} saved`);
        return { site: siteName, found: products.length, saved };
    } catch (e) {
        STATUS.sites[siteName] = { status: 'error', startedAt: STATUS.sites[siteName].startedAt, completedAt: new Date(), found: 0, saved: 0, error: e.message };
        STATUS.errors.push({ site: siteName, error: e.message, at: new Date() });
        console.error(`[Scraper] ${siteName} failed: ${e.message}`);
        return { site: siteName, found: 0, saved: 0, error: e.message };
    }
}

// ── Run seed data for non-live stores ─────────────────────────────────────
async function runSeedStores() {
    const seedResults = seeder.runAll();
    let totalFound = 0, totalSaved = 0;
    for (const { store, products } of seedResults) {
        const siteName = store.toLowerCase().replace(/[^a-z0-9]/g, '');
        STATUS.sites[siteName] = { status: 'running', startedAt: new Date(), found: 0, saved: 0, error: null };
        try {
            const saved = await upsertProducts(products);
            STATUS.sites[siteName] = { status: 'done', startedAt: STATUS.sites[siteName].startedAt, completedAt: new Date(), found: products.length, saved, error: null };
            STATUS.totalFound += products.length;
            STATUS.totalSaved += saved;
            totalFound += products.length;
            totalSaved += saved;
        } catch (e) {
            STATUS.sites[siteName] = { status: 'error', completedAt: new Date(), found: 0, saved: 0, error: e.message };
        }
    }
    console.log(`[Seeder] Done: ${totalFound} products, ${totalSaved} saved`);
}

// ── Single site (live or seed) ─────────────────────────────────────────────
async function runSite(siteName) {
    if (LIVE_SCRAPERS[siteName]) return runLiveSite(siteName);
    // Find in seeder
    const seedStore = seeder.STORES.find(s => s.store.toLowerCase().replace(/\s/g,'') === siteName.toLowerCase());
    if (seedStore) {
        const { products } = seeder.seedStore(seedStore);
        const saved = await upsertProducts(products);
        STATUS.sites[siteName] = { status: 'done', completedAt: new Date(), found: products.length, saved, error: null };
        return { site: siteName, found: products.length, saved };
    }
    throw new Error(`Unknown site: ${siteName}`);
}

// ── Run everything ─────────────────────────────────────────────────────────
async function runAll(sites = null, concurrency = 2) {
    if (STATUS.isRunning) throw new Error('Already running');

    STATUS.isRunning   = true;
    STATUS.startedAt   = new Date();
    STATUS.completedAt = null;
    STATUS.totalFound  = 0;
    STATUS.totalSaved  = 0;
    STATUS.errors      = [];
    STATUS.sites       = {};

    console.log('[Scraper] Starting full scrape...');

    try {
        // 1. Run live scrapers with concurrency limit
        const liveNames = sites
            ? sites.filter(s => LIVE_SCRAPERS[s])
            : Object.keys(LIVE_SCRAPERS);

        const limit = pLimit(concurrency);
        await Promise.allSettled(liveNames.map(s => limit(() => runLiveSite(s))));

        // 2. Seed all non-live stores
        await runSeedStores();

        STATUS.isRunning   = false;
        STATUS.completedAt = new Date();
        const dur = Math.round((STATUS.completedAt - STATUS.startedAt) / 1000);
        console.log(`[Scraper] Finished in ${dur}s — ${STATUS.totalFound} found, ${STATUS.totalSaved} saved`);
        return { duration: dur, totalFound: STATUS.totalFound, totalSaved: STATUS.totalSaved, errors: STATUS.errors };
    } catch (e) {
        STATUS.isRunning   = false;
        STATUS.completedAt = new Date();
        throw e;
    }
}

module.exports = { runAll, runSite, getStatus, scrapers: LIVE_SCRAPERS, ALL_SITES };