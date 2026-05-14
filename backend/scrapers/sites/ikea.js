const { fetchJson, fetchHtml, normalizeProduct, SEARCH_QUERIES } = require('../utils');

const STORE = 'ikea_eg';
const STORE_NAME = 'IKEA Egypt';
const BASE = 'https://www.ikea.com/eg/en';

const QUERIES = [
    'sofa', 'bed', 'wardrobe', 'desk', 'chair', 'bookcase', 'tv unit', 'dining table',
    'kitchen', 'bathroom', 'storage', 'mattress', 'curtains', 'rug', 'lamp', 'mirror',
    'chest of drawers', 'coffee table', 'outdoor furniture', 'childrens furniture'
];

async function scrapeSearch(query, page = 0) {
    // IKEA has a product search API
    const start = page * 24;
    const url = `https://sik.search.blue.cdtapps.com/eg/en/search-result-page?q=${encodeURIComponent(query)}&start=${start}&end=${start + 24}&c=sr&v=20211018&prefetch=false`;
    try {
        const data = await fetchJson(url, {
            headers: { 'accept': 'application/json', 'origin': 'https://www.ikea.com' }
        });
        const items = data?.searchResultPage?.products?.main?.items || [];
        return items.map(item => {
            const p = item.product || item;
            const price = parseFloat(p.salesPrice?.numeral || p.price || 0);
            const originalPrice = parseFloat(p.previousPrice?.numeral || price);
            return normalizeProduct({
                name: [p.mainImageAlt, p.name, p.typeName].filter(Boolean).join(' ').trim() || p.name || '',
                price, originalPrice,
                image: p.mainImageUrl || p.imageUrl || '',
                url: p.pipUrl ? (p.pipUrl.startsWith('http') ? p.pipUrl : `https://www.ikea.com${p.pipUrl}`) : '',
                store: STORE, storeName: STORE_NAME,
                category: 'Furniture',
                brand: 'IKEA'
            });
        }).filter(p => p.name && p.price > 0);
    } catch (_) {}

    // HTML fallback
    const htmlUrl = `${BASE}/search/?q=${encodeURIComponent(query)}`;
    const $ = await fetchHtml(htmlUrl);
    const products = [];

    $('[class*="search-result__item"], [class*="product-compact"]').each((_, el) => {
        try {
            const name = $(el).find('[class*="name"], [class*="title"]').text().trim();
            const priceText = $(el).find('[class*="price"]').first().text().trim();
            const image = $(el).find('img').attr('src') || '';
            const link = $(el).find('a').attr('href') || '';
            if (!name || !priceText) return;
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            if (price < 50) return;
            products.push(normalizeProduct({
                name, price, originalPrice: price,
                image: image.startsWith('http') ? image : `https://www.ikea.com${image}`,
                url: link.startsWith('http') ? link : `https://www.ikea.com${link}`,
                store: STORE, storeName: STORE_NAME, category: 'Furniture', brand: 'IKEA'
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
            console.log(`[IKEA EG] "${q}" => ${products.length} products`);
        } catch (e) {
            console.log(`[IKEA EG] Query "${q}" failed: ${e.message}`);
        }
    }

    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };