const { fetchHtml, normalizeProduct, SEARCH_QUERIES } = require('../utils');

const STORE = 'radioshack_eg';
const STORE_NAME = 'RadioShack Egypt';
const BASE = 'https://www.radioshackegypt.com';

const QUERIES = [
    ...SEARCH_QUERIES.phones, ...SEARCH_QUERIES.laptops, ...SEARCH_QUERIES.tablets,
    ...SEARCH_QUERIES.audio, ...SEARCH_QUERIES.cameras, ...SEARCH_QUERIES.gaming,
    ...SEARCH_QUERIES.tvs, ...SEARCH_QUERIES.appliances,
    'smart home', 'accessories', 'cable', 'charger', 'power bank', 'speaker'
];

async function scrapeSearch(query, page = 1) {
    const url = `${BASE}/en/search?q=${encodeURIComponent(query)}&page=${page}`;
    const $ = await fetchHtml(url, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' }
    });
    const products = [];

    $('.product-item, .product-card, .item-box, [class*="product"]').each((_, el) => {
        try {
            const name = $(el).find('.product-title a, .product-name, [class*="name"], h3, h4').first().text().trim();
            const priceText = $(el).find('.product-price, .price-value, [class*="price"]:not([class*="old"])').first().text().trim();
            const originalText = $(el).find('.old-price, .line-through, s, [class*="old"]').first().text().trim();
            const image = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
            const link = $(el).find('a').first().attr('href') || '';
            const ratingText = $(el).find('[class*="rating"]').attr('title') || '';
            const rating = ratingText ? parseFloat(ratingText) : null;

            if (!name || !priceText) return;

            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            const originalPrice = parseFloat(originalText.replace(/[^0-9.]/g, '')) || price;
            if (price < 50) return;

            products.push(normalizeProduct({
                name, price, originalPrice,
                image: image.startsWith('http') ? image : (image ? BASE + image : ''),
                url: link.startsWith('http') ? link : (link ? BASE + link : ''),
                store: STORE, storeName: STORE_NAME,
                category: null, rating
            }));
        } catch (_) {}
    });

    return products;
}

async function run() {
    const seen = new Set();
    const results = [];

    for (const q of [...new Set(QUERIES)]) {
        try {
            const products = await scrapeSearch(q);
            for (const p of products) {
                if (!seen.has(p.name)) { seen.add(p.name); results.push(p); }
            }
            console.log(`[RadioShack EG] "${q}" => ${products.length} products`);
        } catch (e) {
            console.log(`[RadioShack EG] Query "${q}" failed: ${e.message}`);
        }
    }

    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };