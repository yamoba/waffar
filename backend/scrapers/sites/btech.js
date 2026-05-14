const { fetchHtml, fetchJson, normalizeProduct, getLimiter, SEARCH_QUERIES } = require('../utils');

const STORE = 'btech';
const STORE_NAME = 'B.TECH';
const BASE = 'https://www.btech.com';

const QUERIES = [
    ...SEARCH_QUERIES.phones, ...SEARCH_QUERIES.laptops, ...SEARCH_QUERIES.tablets,
    ...SEARCH_QUERIES.audio, ...SEARCH_QUERIES.cameras, ...SEARCH_QUERIES.gaming,
    ...SEARCH_QUERIES.tvs, ...SEARCH_QUERIES.appliances
];

async function scrapeSearch(query, page = 1) {
    const url = `${BASE}/catalogsearch/result/?q=${encodeURIComponent(query)}&p=${page}`;
    const $ = await fetchHtml(url, { headers: { 'Accept-Language': 'en-US,en;q=0.9' } });
    const products = [];

    $('li.product-item, .product-item-info').each((_, el) => {
        try {
            const name = $(el).find('.product-item-name a, .product-name a').text().trim();
            const priceText = $(el).find('.price-wrapper .price, .special-price .price, .price').first().text().trim();
            const originalText = $(el).find('.old-price .price, .regular-price .price').first().text().trim();
            const image = $(el).find('img.product-image-photo, img').attr('src') || '';
            const link = $(el).find('a.product-item-link, a').attr('href') || '';
            const ratingEl = $(el).find('.rating-result span');
            const rating = ratingEl.length ? parseFloat(ratingEl.attr('style')?.match(/(\d+)/)?.[1] || 0) / 20 : null;

            if (!name || !priceText) return;

            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            const originalPrice = parseFloat(originalText.replace(/[^0-9.]/g, '')) || price;

            products.push(normalizeProduct({
                name, price, originalPrice,
                image: image.startsWith('http') ? image : BASE + image,
                url: link.startsWith('http') ? link : BASE + link,
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
            console.log(`[B.TECH] "${q}" => ${products.length} products`);
        } catch (e) {
            console.log(`[B.TECH] Query "${q}" failed: ${e.message}`);
        }
    }

    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };