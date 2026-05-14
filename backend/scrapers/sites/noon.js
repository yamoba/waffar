'use strict';
// Noon Egypt — uses internal edge search API
const { fetchJson, normalizeProduct, SEARCH_QUERIES } = require('../utils');

const STORE = 'Noon';
const BASE = 'https://www.noon.com';
const API = 'https://noon.com/api/edge/search/v1/';

async function scrapeSearch(query, page = 1) {
    const data = await fetchJson(API, {
        params: {
            q: query,
            cHits: 40,
            page,
            lang: 'en',
            country: 'eg',
            filter: 'true'
        },
        headers: {
            'Referer': `${BASE}/egypt-en/?q=${encodeURIComponent(query)}`,
            'Accept': 'application/json, text/plain, */*',
            'Origin': BASE,
            'x-platform': 'web'
        }
    });

    const hits = data?.hits || data?.data?.hits || [];
    return hits.map(p => normalizeProduct({
        name: p.name || p.title || p._highlightResult?.name?.value,
        price: p.salePrice || p.price?.value || p.priceAmount,
        originalPrice: p.basePrice || p.was_price,
        discount: p.discountPercentage,
        image: p.thumbnail || p.imageUrls?.[0],
        url: p.sku ? `${BASE}/egypt-en/p/${p.sku}/` : '#',
        store: STORE,
        storeName: STORE,
        category: p.category?.nameEn || p.primaryCategory,
        brand: p.brand || p.brandName,
        rating: p.averageRating || p.rating,
        reviewCount: p.reviewCount || p.totalRatings,
        inStock: p.availability !== 'SOLD_OUT' && p.quantity !== 0,
        description: p.description
    })).filter(Boolean);
}

async function run() {
    const results = [];
    const queries = [
        ...SEARCH_QUERIES.phones,
        ...SEARCH_QUERIES.laptops,
        ...SEARCH_QUERIES.tvs,
        ...SEARCH_QUERIES.appliances,
        ...SEARCH_QUERIES.gaming,
        ...SEARCH_QUERIES.fashion,
        ...SEARCH_QUERIES.beauty,
        ...SEARCH_QUERIES.sports,
        ...SEARCH_QUERIES.audio,
        ...SEARCH_QUERIES.tablets
    ];

    for (const q of queries) {
        try {
            const products = await scrapeSearch(q);
            results.push(...products);
        } catch(e) {
            console.log(`[Noon] Query "${q}" failed: ${e.message}`);
        }
    }

    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };