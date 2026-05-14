const { fetchHtml, fetchJson, normalizeProduct, SEARCH_QUERIES } = require('../utils');

const STORE = 'raneen';
const STORE_NAME = 'Raneen';
const BASE = 'https://www.raneen.com';

const QUERIES = [
    ...SEARCH_QUERIES.furniture, ...SEARCH_QUERIES.homeAppliances,
    'sofa', 'bed', 'wardrobe', 'dining table', 'office chair', 'mattress',
    'curtains', 'carpet', 'kitchen cabinet', 'bookshelf', 'tv stand'
];

async function scrapeSearch(query, page = 1) {
    // Try JSON API first (Raneen uses Magento 2 with GraphQL)
    try {
        const apiUrl = `${BASE}/graphql`;
        const gqlBody = {
            query: `{ products(search: "${query.replace(/"/g, '')}", pageSize: 40, currentPage: ${page}) {
                items {
                    name sku url_key small_image { url }
                    price_range { minimum_price {
                        regular_price { value currency }
                        final_price { value currency }
                        discount { percent_off }
                    }}
                }
            }}`
        };
        const data = await fetchJson(apiUrl, { method: 'POST', data: gqlBody });
        const items = data?.data?.products?.items || [];
        if (items.length > 0) {
            return items.map(item => {
                const minPrice = item.price_range?.minimum_price;
                const price = minPrice?.final_price?.value || 0;
                const originalPrice = minPrice?.regular_price?.value || price;
                return normalizeProduct({
                    name: item.name,
                    price, originalPrice,
                    image: item.small_image?.url || '',
                    url: `${BASE}/${item.url_key}`,
                    store: STORE, storeName: STORE_NAME,
                    category: 'Furniture'
                });
            }).filter(p => p.price > 0);
        }
    } catch (_) {}

    // Fallback to HTML
    const url = `${BASE}/catalogsearch/result/?q=${encodeURIComponent(query)}&p=${page}`;
    const $ = await fetchHtml(url);
    const products = [];

    $('.product-item, .product-item-info').each((_, el) => {
        try {
            const name = $(el).find('.product-item-name a, .product-name').text().trim();
            const priceText = $(el).find('.price').first().text().trim();
            const image = $(el).find('img').attr('src') || '';
            const link = $(el).find('a').attr('href') || '';
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
            console.log(`[Raneen] "${q}" => ${products.length} products`);
        } catch (e) {
            console.log(`[Raneen] Query "${q}" failed: ${e.message}`);
        }
    }

    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };