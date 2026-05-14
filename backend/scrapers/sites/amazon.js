'use strict';
const { fetchHtml, normalizeProduct, SEARCH_QUERIES } = require('../utils');

const STORE      = 'Amazon Egypt';
const BASE       = 'https://www.amazon.eg';
const SEARCH_URL = `${BASE}/-/en/s`;

const QUERIES = [
    ...SEARCH_QUERIES.phones,   ...SEARCH_QUERIES.laptops,
    ...SEARCH_QUERIES.tvs,      ...SEARCH_QUERIES.gaming,
    ...SEARCH_QUERIES.audio,    ...SEARCH_QUERIES.appliances,
    ...SEARCH_QUERIES.tablets,  ...SEARCH_QUERIES.cameras,
    ...SEARCH_QUERIES.fashion,  ...SEARCH_QUERIES.beauty,
    ...SEARCH_QUERIES.sports,   ...SEARCH_QUERIES.watches,
    ...SEARCH_QUERIES.books,    ...SEARCH_QUERIES.grocery,
    'toys', 'baby products', 'office supplies', 'kitchen accessories',
];

async function scrapeSearch(query, page = 1) {
    const $ = await fetchHtml(SEARCH_URL, {
        params: { k: query, page },
        headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept':          'text/html,application/xhtml+xml,*/*;q=0.8',
        }
    });

    const products = [];
    $('[data-component-type="s-search-result"]').each((_, el) => {
        try {
            // h2 may have [brand, name] spans or just [name] — take full h2 text
            const name = $(el).find('h2').text().trim();
            if (!name) return;

            const wholeText = $(el).find('.a-price-whole').first().text().replace(/[^0-9]/g, '');
            if (!wholeText) return;
            const fracText  = $(el).find('.a-price-fraction').first().text().replace(/[^0-9]/g, '') || '00';
            const price     = parseFloat(`${wholeText}.${fracText}`) || 0;

            const origText  = $(el).find('.a-text-price .a-offscreen, .a-price.a-text-price .a-offscreen').first().text().trim();
            const origPrice = parseFloat(origText.replace(/[^0-9.]/g, '')) || price;

            const asin  = $(el).attr('data-asin') || '';
            const image = $(el).find('img.s-image').attr('src') || '';
            const url   = asin ? `${BASE}/dp/${asin}` : '';

            const ratingText  = $(el).find('span[aria-label*="out of 5"]').attr('aria-label') || '';
            const rating      = ratingText ? parseFloat(ratingText) : null;
            const reviewText  = $(el).find('span[aria-label*=" rating"]').next().attr('aria-label') || '';
            const reviewCount = parseInt(reviewText.replace(/[^0-9]/g, '')) || 0;

            const brand = $(el).find('.a-row .a-size-base-plus.a-color-base').first().text().trim() || '';

            products.push(normalizeProduct({
                name, price, originalPrice: origPrice,
                image, url,
                store: STORE, storeName: STORE,
                category: null,
                brand, rating, reviewCount, inStock: true,
            }));
        } catch (_) {}
    });

    return products;
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
            console.log(`[Amazon EG] "${q}" => ${products.length} found, ${added} new`);
        } catch (e) {
            console.log(`[Amazon EG] "${q}" failed: ${e.message}`);
        }
    }
    return { store: STORE, products: results };
}

module.exports = { run, scrapeSearch };