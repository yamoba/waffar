const { fetchHtml, normalizeProduct, SEARCH_QUERIES } = require('../utils');

const STORE = 'elaraby';
const STORE_NAME = 'El Araby';
const BASE = 'https://www.elaraby.com.eg';

const QUERIES = [
    ...SEARCH_QUERIES.tvs, ...SEARCH_QUERIES.appliances, ...SEARCH_QUERIES.phones,
    ...SEARCH_QUERIES.laptops, ...SEARCH_QUERIES.cameras, ...SEARCH_QUERIES.audio
];

async function scrapeSearch(query, page = 1) {
    const url = `${BASE}/search?keyword=${encodeURIComponent(query)}&page=${page}`;
    const $ = await fetchHtml(url);
    const products = [];

    $('.product-item, .product-box, .item, [class*="product-card"]').each((_, el) => {
        try {
            const name = $(el).find('[class*="name"], [class*="title"], h2, h3').first().text().trim();
            const priceText = $(el).find('[class*="price"]:not([class*="old"])').first().text().trim();
            const originalText = $(el).find('[class*="old"], [class*="was"]').first().text().trim();
            const image = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
            const link = $(el).find('a').first().attr('href') || '';

            if (!name || !priceText) return;

            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            const originalPrice = parseFloat(originalText.replace(/[^0-9.]/g, '')) || price;
            if (price < 50) return;

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
            console.log(`[El Araby] "${q}" => ${products.length} products`);
        } catch (e) {
            console.log(`[El Araby] Query "${q}" failed: ${e.message}`);
        }
    }

    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };