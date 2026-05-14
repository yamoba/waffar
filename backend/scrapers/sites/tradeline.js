const { fetchJson, fetchHtml, normalizeProduct, SEARCH_QUERIES } = require('../utils');

// Tradeline Egypt - home appliances and electronics
const STORE = 'tradeline';
const STORE_NAME = 'Tradeline';
const BASE = 'https://www.tradeline.com.eg';

const QUERIES = [
    ...SEARCH_QUERIES.appliances, ...SEARCH_QUERIES.tvs, ...SEARCH_QUERIES.phones,
    ...SEARCH_QUERIES.laptops, ...SEARCH_QUERIES.audio, ...SEARCH_QUERIES.cameras,
    'air conditioner', 'washing machine', 'refrigerator', 'microwave', 'vacuum cleaner',
    'coffee maker', 'blender', 'iron', 'water heater'
];

async function scrapeSearch(query, page = 1) {
    // Tradeline uses WooCommerce-based search
    try {
        const apiUrl = `${BASE}/wp-json/wc/store/v1/products?search=${encodeURIComponent(query)}&per_page=40&page=${page}`;
        const items = await fetchJson(apiUrl);
        if (Array.isArray(items) && items.length > 0) {
            return items.map(item => {
                const price = parseFloat(item.prices?.price || 0) / 100;
                const originalPrice = parseFloat(item.prices?.regular_price || item.prices?.price || 0) / 100;
                return normalizeProduct({
                    name: item.name || '',
                    price, originalPrice,
                    image: item.images?.[0]?.src || '',
                    url: item.permalink || '',
                    store: STORE, storeName: STORE_NAME,
                    category: null,
                    brand: item.attributes?.find(a => a.name === 'Brand')?.terms?.[0]?.name || ''
                });
            }).filter(p => p.name && p.price > 0);
        }
    } catch (_) {}

    // HTML fallback
    const url = `${BASE}/?s=${encodeURIComponent(query)}&post_type=product&paged=${page}`;
    const $ = await fetchHtml(url);
    const products = [];

    $('li.product, .product-item, .product-card').each((_, el) => {
        try {
            const name = $(el).find('.woocommerce-loop-product__title, h2, h3, [class*="name"]').first().text().trim();
            const priceText = $(el).find('.price ins .amount, .price .amount, [class*="price"]:not([class*="del"])').first().text().trim();
            const originalText = $(el).find('.price del .amount, [class*="regular"]').first().text().trim();
            const image = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
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
            console.log(`[Tradeline] "${q}" => ${products.length} products`);
        } catch (e) {
            console.log(`[Tradeline] Query "${q}" failed: ${e.message}`);
        }
    }

    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };