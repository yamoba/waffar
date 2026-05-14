const { fetchJson, fetchHtml, normalizeProduct, SEARCH_QUERIES } = require('../utils');

const STORE = 'extra';
const STORE_NAME = 'eXtra';
const BASE = 'https://www.extrastores.com';

const QUERIES = [
    ...SEARCH_QUERIES.phones, ...SEARCH_QUERIES.laptops, ...SEARCH_QUERIES.tablets,
    ...SEARCH_QUERIES.tvs, ...SEARCH_QUERIES.audio, ...SEARCH_QUERIES.cameras,
    ...SEARCH_QUERIES.gaming, ...SEARCH_QUERIES.appliances
];

async function scrapeSearch(query, page = 1) {
    // eXtra uses Algolia search
    try {
        const algoliaUrl = 'https://js6vhyd25k-dsn.algolia.net/1/indexes/*/queries';
        const body = {
            requests: [{
                indexName: 'eg_en_products',
                params: `query=${encodeURIComponent(query)}&hitsPerPage=40&page=${page - 1}&filters=country%3AEG`
            }]
        };
        const data = await fetchJson(algoliaUrl, {
            method: 'POST', data: body,
            headers: {
                'x-algolia-application-id': 'JS6VHyd25K',
                'x-algolia-api-key': '9a8e6e90b5e0d1e43d9f4c5b7a8d3c21',
                'content-type': 'application/json'
            }
        });
        const hits = data?.results?.[0]?.hits || [];
        if (hits.length > 0) {
            return hits.map(item => {
                const price = parseFloat(item.price?.EGP || item.price || 0);
                const originalPrice = parseFloat(item.originalPrice?.EGP || item.compareAtPrice || price);
                return normalizeProduct({
                    name: item.name || item.title || '',
                    price, originalPrice,
                    image: item.images?.[0] || item.image || item.thumbnail || '',
                    url: item.url || item.handle ? `${BASE}/en-eg/products/${item.handle}` : '',
                    store: STORE, storeName: STORE_NAME,
                    category: null,
                    brand: item.brand || item.vendor || '',
                    rating: item.rating || null,
                    reviewCount: item.reviewCount || 0
                });
            }).filter(p => p.name && p.price > 0);
        }
    } catch (_) {}

    // HTML fallback
    const url = `${BASE}/en-eg/search?q=${encodeURIComponent(query)}&page=${page}`;
    const $ = await fetchHtml(url);
    const products = [];

    $('[class*="product-card"], [class*="product-item"], .product').each((_, el) => {
        try {
            const name = $(el).find('[class*="name"], [class*="title"], h3').first().text().trim();
            const priceText = $(el).find('[class*="price"]:not([class*="old"])').first().text().trim();
            const originalText = $(el).find('[class*="old-price"], s').first().text().trim();
            const image = $(el).find('img').first().attr('src') || '';
            const link = $(el).find('a').first().attr('href') || '';
            if (!name || !priceText) return;
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            const originalPrice = parseFloat(originalText.replace(/[^0-9.]/g, '')) || price;
            if (price < 50) return;
            products.push(normalizeProduct({
                name, price, originalPrice,
                image: image.startsWith('http') ? image : BASE + image,
                url: link.startsWith('http') ? link : BASE + link,
                store: STORE, storeName: STORE_NAME, category: null
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
            console.log(`[eXtra] "${q}" => ${products.length} products`);
        } catch (e) {
            console.log(`[eXtra] Query "${q}" failed: ${e.message}`);
        }
    }

    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };