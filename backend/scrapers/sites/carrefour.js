'use strict';
// Carrefour Egypt — SAP Commerce OCC API
const { fetchJson, normalizeProduct, SEARCH_QUERIES } = require('../utils');

const STORE = 'Carrefour';
const API_BASE = 'https://api.carrefouregypt.com/occ/v2/carrefour-eg/products/search';

async function scrapeSearch(query, page = 0) {
    const data = await fetchJson(API_BASE, {
        params: {
            query: query + ':relevance',
            pageSize: 40,
            currentPage: page,
            lang: 'en',
            curr: 'EGP',
            fields: 'FULL'
        },
        headers: {
            'Referer': 'https://www.carrefouregypt.com/',
            'Accept': 'application/json',
            'Origin': 'https://www.carrefouregypt.com'
        }
    });

    const products = data?.products || [];
    return products.map(p => {
        const price = p.price?.value || p.lowPrice?.value;
        const origPrice = p.wasPrice?.value;
        return normalizeProduct({
            name: p.name || p.summary,
            price,
            originalPrice: origPrice,
            discount: origPrice && price ? Math.round(((origPrice - price) / origPrice) * 100) : 0,
            image: p.images?.[0]?.url ? `https://www.carrefouregypt.com${p.images[0].url}` : null,
            url: p.url ? `https://www.carrefouregypt.com${p.url}` : '#',
            store: STORE,
            storeName: STORE,
            category: p.categories?.[0]?.name || p.productType,
            brand: p.manufacturer || p.brandName,
            rating: p.averageRating,
            reviewCount: p.numberOfReviews,
            inStock: p.stock?.stockLevelStatus !== 'outOfStock',
            description: p.description
        });
    }).filter(Boolean);
}

async function run() {
    const results = [];
    const queries = [
        ...SEARCH_QUERIES.phones,
        ...SEARCH_QUERIES.tvs,
        ...SEARCH_QUERIES.appliances,
        ...SEARCH_QUERIES.grocery,
        ...SEARCH_QUERIES.fashion,
        ...SEARCH_QUERIES.beauty,
        ...SEARCH_QUERIES.sports,
        'rice', 'oil', 'water', 'detergent', 'coffee',
        'blender', 'microwave', 'vacuum cleaner'
    ];

    for (const q of queries) {
        try {
            const products = await scrapeSearch(q);
            results.push(...products);
        } catch(e) {
            console.log(`[Carrefour] Query "${q}" failed: ${e.message}`);
        }
    }
    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };