const { fetchHtml, normalizeProduct, SEARCH_QUERIES } = require('../utils');

const STORE = '2b';
const STORE_NAME = '2B Egypt';
const BASE = 'https://www.2b.com.eg';

const QUERIES = [
    ...SEARCH_QUERIES.phones, ...SEARCH_QUERIES.laptops, ...SEARCH_QUERIES.tablets,
    ...SEARCH_QUERIES.audio, ...SEARCH_QUERIES.cameras, ...SEARCH_QUERIES.gaming,
    ...SEARCH_QUERIES.tvs, ...SEARCH_QUERIES.appliances
];

async function scrapeSearch(query, page = 1) {
    const url = `${BASE}/search?q=${encodeURIComponent(query)}&page=${page}`;
    const $ = await fetchHtml(url);
    const products = [];

    $('.product-item, .product-card, [class*="product"]').each((_, el) => {
        try {
            const name = $(el).find('[class*="name"], h2, h3, .title').first().text().trim();
            const priceText = $(el).find('[class*="price"]:not([class*="old"]):not([class*="regular"])').first().text().trim()
                || $(el).find('[class*="price"]').first().text().trim();
            const originalText = $(el).find('[class*="old-price"], [class*="regular-price"]').first().text().trim();
            const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
            const link = $(el).find('a').attr('href') || '';

            if (!name || !priceText) return;

            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            const originalPrice = parseFloat(originalText.replace(/[^0-9.]/g, '')) || price;
            if (price < 10) return;

            products.push(normalizeProduct({
                name, price, originalPrice,
                image: image.startsWith('http') ? image : (image ? BASE + image : ''),
                url: link.startsWith('http') ? link : (link ? BASE + link : ''),
                store: STORE, storeName: STORE_NAME,
                category: null
            }));
        } catch (_) {}
    });

    return products;
}

async function run() {
    const seen = new Set();
    const results = [];
    const unique = [...new Set(QUERIES)];

    for (const q of unique) {
        try {
            const products = await scrapeSearch(q);
            for (const p of products) {
                if (!seen.has(p.name)) {
                    seen.add(p.name);
                    results.push(p);
                }
            }
            console.log(`[2B] "${q}" => ${products.length} products`);
        } catch (e) {
            console.log(`[2B] Query "${q}" failed: ${e.message}`);
        }
    }

    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };