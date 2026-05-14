const { fetchJson, fetchHtml, normalizeProduct, SEARCH_QUERIES } = require('../utils');

const STORE = 'namshi';
const STORE_NAME = 'Namshi';
const BASE = 'https://www.namshi.com';

const QUERIES = [
    ...SEARCH_QUERIES.fashion, ...SEARCH_QUERIES.shoes,
    'mens t-shirt', 'womens dress', 'jeans', 'sneakers', 'sandals', 'jacket',
    'handbag', 'perfume', 'sunglasses', 'watch', 'sportswear', 'underwear',
    'kids clothing', 'swimwear', 'abaya', 'hoodie'
];

async function scrapeSearch(query, page = 1) {
    // Namshi uses an internal search API
    const url = `${BASE}/api/product-search/v2/search/?q=${encodeURIComponent(query)}&page=${page}&limit=40&language=en&country=EG`;
    try {
        const data = await fetchJson(url, {
            headers: {
                'x-country-code': 'EG',
                'x-language-code': 'en',
                'Accept': 'application/json'
            }
        });
        const items = data?.products || data?.data?.products || data?.hits || [];
        return items.map(item => {
            const price = parseFloat(item.price || item.salePrice || 0);
            const originalPrice = parseFloat(item.originalPrice || item.rrp || price);
            return normalizeProduct({
                name: item.name || item.title || '',
                price, originalPrice,
                image: item.image || item.imageUrl || item.thumbnail || '',
                url: item.url ? (item.url.startsWith('http') ? item.url : `${BASE}${item.url}`) : '',
                store: STORE, storeName: STORE_NAME,
                category: 'Fashion',
                brand: item.brand || item.brandName || '',
                rating: item.rating || null,
                reviewCount: item.reviewCount || 0
            });
        }).filter(p => p.name && p.price > 0);
    } catch (_) {}

    // HTML fallback
    const htmlUrl = `${BASE}/en-eg/search/?q=${encodeURIComponent(query)}&page=${page}`;
    const $ = await fetchHtml(htmlUrl);
    const products = [];

    $('[class*="product"], [data-testid*="product"]').each((_, el) => {
        try {
            const name = $(el).find('[class*="name"], [class*="brand"], h3').text().trim();
            const priceText = $(el).find('[class*="price"]:not([class*="old"])').first().text().trim();
            const image = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
            const link = $(el).find('a').first().attr('href') || '';
            if (!name || !priceText) return;
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            if (price < 10) return;
            products.push(normalizeProduct({
                name, price, originalPrice: price,
                image: image.startsWith('http') ? image : BASE + image,
                url: link.startsWith('http') ? link : BASE + link,
                store: STORE, storeName: STORE_NAME, category: 'Fashion'
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
            console.log(`[Namshi] "${q}" => ${products.length} products`);
        } catch (e) {
            console.log(`[Namshi] Query "${q}" failed: ${e.message}`);
        }
    }

    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };