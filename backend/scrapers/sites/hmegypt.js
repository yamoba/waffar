const { fetchJson, fetchHtml, normalizeProduct, SEARCH_QUERIES } = require('../utils');

const STORE = 'hm_eg';
const STORE_NAME = 'H&M Egypt';
const BASE = 'https://www2.hm.com';

const QUERIES = [
    'mens t-shirt', 'womens dress', 'jeans', 'jacket', 'coat', 'sweater',
    'kids clothes', 'baby clothes', 'sportswear', 'pyjamas', 'swimwear',
    'accessories', 'bag', 'scarf', 'hat', 'socks', 'underwear',
    'mens trousers', 'womens blouse', 'hoodie'
];

async function scrapeSearch(query, page = 1) {
    // H&M has an internal API
    const offset = (page - 1) * 36;
    const url = `${BASE}/en_eg/search-results.html?q=${encodeURIComponent(query)}&offset=${offset}&page-size=36&sort=RELEVANCE`;

    try {
        const apiUrl = `https://www2.hm.com/en_eg/search-results/_jcr_content/search-results.display.json?q=${encodeURIComponent(query)}&offset=${offset}&page-size=36`;
        const data = await fetchJson(apiUrl, {
            headers: { 'Accept': 'application/json', 'x-requested-with': 'XMLHttpRequest' }
        });
        const items = data?.products || data?.results || [];
        return items.map(item => {
            const price = parseFloat(item.price?.value || item.salePrice || 0);
            const originalPrice = parseFloat(item.whitePrice?.value || item.price?.value || price);
            return normalizeProduct({
                name: item.name || item.title || '',
                price, originalPrice,
                image: item.images?.[0]?.url || item.image || '',
                url: item.link ? `https://www2.hm.com${item.link}` : '',
                store: STORE, storeName: STORE_NAME,
                category: 'Fashion',
                brand: 'H&M'
            });
        }).filter(p => p.name && p.price > 0);
    } catch (_) {}

    // HTML fallback
    const $ = await fetchHtml(url);
    const products = [];

    $('article.hm-product-item, li.product-item').each((_, el) => {
        try {
            const name = $(el).find('.item-heading, h2, h3, [class*="name"]').first().text().trim();
            const priceText = $(el).find('[class*="price"]:not([class*="old"])').first().text().trim();
            const originalText = $(el).find('[class*="old-price"], s').first().text().trim();
            const image = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
            const link = $(el).find('a').first().attr('href') || '';
            if (!name || !priceText) return;
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            const originalPrice = parseFloat(originalText.replace(/[^0-9.]/g, '')) || price;
            if (price < 10) return;
            products.push(normalizeProduct({
                name, price, originalPrice,
                image: image.startsWith('http') ? image : `https:${image}`,
                url: link.startsWith('http') ? link : `https://www2.hm.com${link}`,
                store: STORE, storeName: STORE_NAME, category: 'Fashion', brand: 'H&M'
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
            console.log(`[H&M EG] "${q}" => ${products.length} products`);
        } catch (e) {
            console.log(`[H&M EG] Query "${q}" failed: ${e.message}`);
        }
    }

    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };