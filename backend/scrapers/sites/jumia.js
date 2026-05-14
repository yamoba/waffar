'use strict';
const { fetchJson, normalizeProduct, SEARCH_QUERIES } = require('../utils');

const STORE = 'Jumia';
const BASE  = 'https://www.jumia.com.eg';

const QUERIES = [
    ...SEARCH_QUERIES.phones,   ...SEARCH_QUERIES.laptops,
    ...SEARCH_QUERIES.tvs,      ...SEARCH_QUERIES.gaming,
    ...SEARCH_QUERIES.audio,    ...SEARCH_QUERIES.appliances,
    ...SEARCH_QUERIES.tablets,  ...SEARCH_QUERIES.cameras,
    ...SEARCH_QUERIES.fashion,  ...SEARCH_QUERIES.beauty,
    ...SEARCH_QUERIES.sports,   ...SEARCH_QUERIES.watches,
];

async function scrapeSearch(query, page = 1) {
    const data = await fetchJson(`${BASE}/catalog/`, {
        params: { q: query, page, limit: 40 },
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept':           'application/json',
            'Referer':          `${BASE}/catalog/?q=${encodeURIComponent(query)}`,
        }
    });

    const items = data?.viewData?.products || [];
    return items.map(p => {
        const price     = parseFloat(p.prices?.rawPrice) || 0;
        const origText  = p.prices?.oldPrice || '';
        const origPrice = parseFloat(origText.replace(/[^0-9.]/g, '')) || price;
        return normalizeProduct({
            name:         p.displayName || p.name,
            price,
            originalPrice: origPrice,
            discount:     p.prices?.discount,
            image:        p.image,
            url:          p.url ? `${BASE}${p.url}` : '',
            store:        STORE,
            storeName:    STORE,
            category:     p.categories?.[0]?.name || null,
            brand:        p.brand || '',
            rating:       p.rating?.average || null,
            reviewCount:  p.rating?.count   || 0,
            inStock:      p.isBuyable !== false,
        });
    }).filter(Boolean);
}

async function run() {
    const seen    = new Set();
    const results = [];

    for (const q of [...new Set(QUERIES)]) {
        try {
            const products = await scrapeSearch(q);
            let added = 0;
            for (const p of products) {
                if (!seen.has(p.name)) { seen.add(p.name); results.push(p); added++; }
            }
            console.log(`[Jumia] "${q}" => ${products.length} found, ${added} new`);
        } catch (e) {
            console.log(`[Jumia] "${q}" failed: ${e.message}`);
        }
    }
    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };