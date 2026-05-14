const { fetchJson, normalizeProduct, SEARCH_QUERIES } = require('../utils');

const STORE = 'homzmart';
const STORE_NAME = 'Homzmart';
const BASE = 'https://www.homzmart.com';

const QUERIES = [
    ...SEARCH_QUERIES.furniture, ...SEARCH_QUERIES.homeAppliances,
    'sofa', 'bed frame', 'wardrobe', 'dining set', 'office desk', 'mattress',
    'lighting', 'rugs', 'bathroom accessories', 'storage', 'kitchen organizer'
];

async function scrapeSearch(query, page = 1) {
    // Homzmart uses an internal REST API
    const url = `${BASE}/api/catalog/products?query=${encodeURIComponent(query)}&page=${page}&per_page=40&country=EG&lang=en`;
    try {
        const data = await fetchJson(url, {
            headers: { 'x-country': 'EG', 'x-lang': 'en', 'x-platform': 'web' }
        });
        const items = data?.data || data?.products || data?.items || [];
        return items.map(item => {
            const price = parseFloat(item.price || item.sale_price || item.final_price || 0);
            const originalPrice = parseFloat(item.original_price || item.regular_price || price);
            return normalizeProduct({
                name: item.name || item.title || '',
                price, originalPrice,
                image: item.image || item.thumbnail || item.main_image || '',
                url: item.url || item.slug ? `${BASE}/product/${item.slug}` : '',
                store: STORE, storeName: STORE_NAME,
                category: 'Furniture',
                rating: item.rating || item.average_rating || null,
                reviewCount: item.reviews_count || item.review_count || 0,
                brand: item.brand || ''
            });
        }).filter(p => p.name && p.price > 0);
    } catch (_) {}

    // Fallback: HTML scraping
    const { fetchHtml } = require('../utils');
    const htmlUrl = `${BASE}/en/search?q=${encodeURIComponent(query)}&page=${page}`;
    const $ = await fetchHtml(htmlUrl);
    const products = [];

    $('[class*="product"], [class*="card"], [data-product]').each((_, el) => {
        try {
            const name = $(el).find('[class*="name"], [class*="title"]').first().text().trim();
            const priceText = $(el).find('[class*="price"]:not([class*="old"])').first().text().trim();
            const image = $(el).find('img').first().attr('src') || '';
            const link = $(el).find('a').first().attr('href') || '';
            if (!name || !priceText) return;
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            if (price < 50) return;
            products.push(normalizeProduct({
                name, price, originalPrice: price,
                image: image.startsWith('http') ? image : BASE + image,
                url: link.startsWith('http') ? link : BASE + link,
                store: STORE, storeName: STORE_NAME, category: 'Furniture'
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
            console.log(`[Homzmart] "${q}" => ${products.length} products`);
        } catch (e) {
            console.log(`[Homzmart] Query "${q}" failed: ${e.message}`);
        }
    }

    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };