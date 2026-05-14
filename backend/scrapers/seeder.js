'use strict';
// Generates realistic seed products for stores that can't be scraped live.
// Products are based on real Egyptian market prices (EGP).

const STORES = [
    { store: 'Noon',        storeName: 'Noon',         categories: ['Electronics','Phones','Laptops','Fashion','Beauty'] },
    { store: 'Carrefour',   storeName: 'Carrefour',    categories: ['Appliances','Grocery','Electronics','Baby','Sports'] },
    { store: 'B.TECH',      storeName: 'B.TECH',       categories: ['Phones','Laptops','Tablets','Audio','Gaming','Cameras'] },
    { store: '2B',          storeName: '2B Egypt',     categories: ['Phones','Laptops','Tablets','Audio','Gaming'] },
    { store: 'El Araby',    storeName: 'El Araby',     categories: ['Appliances','TVs','Electronics','Audio'] },
    { store: 'Raneen',      storeName: 'Raneen',       categories: ['Furniture','Home','Kitchen','Bathroom'] },
    { store: 'Homzmart',    storeName: 'Homzmart',     categories: ['Furniture','Home','Lighting','Decor'] },
    { store: 'Namshi',      storeName: 'Namshi',       categories: ['Fashion','Shoes','Bags','Beauty'] },
    { store: 'IKEA',        storeName: 'IKEA Egypt',   categories: ['Furniture','Storage','Lighting','Textiles'] },
    { store: 'H&M',         storeName: 'H&M Egypt',    categories: ['Fashion','Kids','Sports','Accessories'] },
    { store: 'eXtra',       storeName: 'eXtra',        categories: ['Phones','Laptops','Tablets','Gaming','Audio'] },
    { store: 'RadioShack',  storeName: 'RadioShack',   categories: ['Electronics','Audio','Accessories','Smart Home'] },
    { store: 'Tradeline',   storeName: 'Tradeline',    categories: ['Appliances','TVs','Electronics','Kitchen'] },
];

const SEED_PRODUCTS = [
    // Phones
    { name: 'iPhone 16 Pro Max 256GB Desert Titanium', cat: 'Phones', price: 52999, orig: 59999, brand: 'Apple', rating: 4.8, reviews: 342, img: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400' },
    { name: 'iPhone 15 128GB Black', cat: 'Phones', price: 35999, orig: 39999, brand: 'Apple', rating: 4.7, reviews: 1200, img: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400' },
    { name: 'Samsung Galaxy S25 Ultra 256GB', cat: 'Phones', price: 48999, orig: 53999, brand: 'Samsung', rating: 4.6, reviews: 890, img: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400' },
    { name: 'Samsung Galaxy A55 5G 128GB', cat: 'Phones', price: 14999, orig: 16999, brand: 'Samsung', rating: 4.4, reviews: 567, img: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400' },
    { name: 'Xiaomi Redmi Note 13 Pro 256GB', cat: 'Phones', price: 11999, orig: 13499, brand: 'Xiaomi', rating: 4.5, reviews: 423, img: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400' },
    { name: 'OPPO Reno 12 Pro 256GB', cat: 'Phones', price: 17999, orig: 20999, brand: 'OPPO', rating: 4.3, reviews: 198, img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400' },
    { name: 'Realme 12 Pro+ 512GB', cat: 'Phones', price: 14499, orig: 16999, brand: 'Realme', rating: 4.2, reviews: 156, img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400' },
    { name: 'Huawei Nova 12 SE 256GB', cat: 'Phones', price: 12999, orig: 14999, brand: 'Huawei', rating: 4.1, reviews: 87, img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400' },
    // Laptops
    { name: 'MacBook Air M3 13" 8GB 256GB Space Gray', cat: 'Laptops', price: 39999, orig: 44999, brand: 'Apple', rating: 4.9, reviews: 512, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400' },
    { name: 'MacBook Pro M4 14" 16GB 512GB', cat: 'Laptops', price: 67999, orig: 74999, brand: 'Apple', rating: 4.9, reviews: 234, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400' },
    { name: 'Dell XPS 15 Core i7 32GB 1TB RTX 4060', cat: 'Laptops', price: 52999, orig: 59999, brand: 'Dell', rating: 4.7, reviews: 189, img: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400' },
    { name: 'Lenovo ThinkPad X1 Carbon Gen 12', cat: 'Laptops', price: 58999, orig: 65999, brand: 'Lenovo', rating: 4.8, reviews: 145, img: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400' },
    { name: 'HP Spectre x360 14 2-in-1 Touch Core i7', cat: 'Laptops', price: 41999, orig: 47999, brand: 'HP', rating: 4.6, reviews: 203, img: 'https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?w=400' },
    { name: 'ASUS ROG Zephyrus G16 RTX 4070', cat: 'Laptops', price: 55999, orig: 62999, brand: 'ASUS', rating: 4.7, reviews: 312, img: 'https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?w=400' },
    { name: 'Lenovo IdeaPad 5 Core i5 8GB 512GB', cat: 'Laptops', price: 18999, orig: 22999, brand: 'Lenovo', rating: 4.4, reviews: 445, img: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400' },
    // TVs
    { name: 'Samsung 65" QLED 4K Smart TV QN90D', cat: 'TVs', price: 34999, orig: 42999, brand: 'Samsung', rating: 4.8, reviews: 267, img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400' },
    { name: 'LG 55" OLED C3 4K Smart TV', cat: 'TVs', price: 39999, orig: 47999, brand: 'LG', rating: 4.9, reviews: 189, img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400' },
    { name: 'TCL 75" 4K QLED Android TV C745', cat: 'TVs', price: 24999, orig: 29999, brand: 'TCL', rating: 4.5, reviews: 334, img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400' },
    { name: 'Hisense 50" 4K ULED Smart TV U6K', cat: 'TVs', price: 13999, orig: 16999, brand: 'Hisense', rating: 4.4, reviews: 211, img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400' },
    // Audio
    { name: 'Sony WH-1000XM5 Wireless Headphones Black', cat: 'Audio', price: 14999, orig: 17999, brand: 'Sony', rating: 4.9, reviews: 1450, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' },
    { name: 'Apple AirPods Pro 2nd Generation', cat: 'Audio', price: 11999, orig: 13999, brand: 'Apple', rating: 4.8, reviews: 2100, img: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400' },
    { name: 'Samsung Galaxy Buds3 Pro', cat: 'Audio', price: 8999, orig: 10999, brand: 'Samsung', rating: 4.6, reviews: 430, img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400' },
    { name: 'JBL Charge 5 Portable Waterproof Speaker', cat: 'Audio', price: 4299, orig: 5499, brand: 'JBL', rating: 4.7, reviews: 876, img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400' },
    // Appliances
    { name: 'Samsung 24kg Front Load Washing Machine', cat: 'Appliances', price: 18999, orig: 22999, brand: 'Samsung', rating: 4.6, reviews: 234, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
    { name: 'Toshiba 24-ft 3-door Refrigerator', cat: 'Appliances', price: 24999, orig: 29999, brand: 'Toshiba', rating: 4.5, reviews: 187, img: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400' },
    { name: 'Carrier 1.5 HP Split AC Cool Only', cat: 'Appliances', price: 11999, orig: 14999, brand: 'Carrier', rating: 4.4, reviews: 445, img: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400' },
    { name: 'Dyson V15 Detect Absolute Cordless Vacuum', cat: 'Appliances', price: 19999, orig: 23999, brand: 'Dyson', rating: 4.8, reviews: 312, img: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400' },
    { name: 'Philips Air Fryer XXL 7.3L', cat: 'Appliances', price: 6499, orig: 7999, brand: 'Philips', rating: 4.7, reviews: 678, img: 'https://images.unsplash.com/photo-1632649013016-56fb80bf71ff?w=400' },
    // Gaming
    { name: 'PlayStation 5 Slim Disc Edition', cat: 'Gaming', price: 24999, orig: 27999, brand: 'Sony', rating: 4.9, reviews: 892, img: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400' },
    { name: 'Xbox Series X 1TB', cat: 'Gaming', price: 22999, orig: 25999, brand: 'Microsoft', rating: 4.8, reviews: 445, img: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400' },
    { name: 'Nintendo Switch OLED White', cat: 'Gaming', price: 14999, orig: 16999, brand: 'Nintendo', rating: 4.8, reviews: 678, img: 'https://images.unsplash.com/photo-1617096200347-cb04ae810b1d?w=400' },
    // Fashion
    { name: 'Nike Air Max 270 React Running Shoes', cat: 'Fashion', price: 3499, orig: 4299, brand: 'Nike', rating: 4.6, reviews: 567, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
    { name: 'Adidas Ultraboost 22 Running Shoes', cat: 'Fashion', price: 3999, orig: 4999, brand: 'Adidas', rating: 4.7, reviews: 489, img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400' },
    { name: 'Levi\'s 501 Original Fit Jeans', cat: 'Fashion', price: 1499, orig: 1999, brand: 'Levi\'s', rating: 4.5, reviews: 1234, img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400' },
    { name: 'Zara Men\'s Wool Blend Coat', cat: 'Fashion', price: 2999, orig: 3999, brand: 'Zara', rating: 4.3, reviews: 234, img: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400' },
    // Beauty
    { name: 'L\'Oreal Paris Hyaluronic Acid Serum 30ml', cat: 'Beauty', price: 599, orig: 799, brand: 'L\'Oreal', rating: 4.6, reviews: 890, img: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400' },
    { name: 'Chanel Chance Eau Tendre 100ml EDP', cat: 'Beauty', price: 5999, orig: 6999, brand: 'Chanel', rating: 4.9, reviews: 345, img: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400' },
    { name: 'CeraVe Hydrating Facial Cleanser 237ml', cat: 'Beauty', price: 399, orig: 499, brand: 'CeraVe', rating: 4.8, reviews: 1567, img: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400' },
    // Furniture
    { name: 'IKEA POÄNG Armchair Birch Veneer', cat: 'Furniture', price: 3499, orig: 3999, brand: 'IKEA', rating: 4.6, reviews: 234, img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400' },
    { name: 'Modern L-Shaped Sectional Sofa Gray', cat: 'Furniture', price: 14999, orig: 18999, brand: 'HomeMax', rating: 4.4, reviews: 156, img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400' },
    { name: 'King Size Bed Frame with Storage Walnut', cat: 'Furniture', price: 9999, orig: 12999, brand: 'Raneen', rating: 4.5, reviews: 89, img: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=400' },
    // Tablets
    { name: 'Apple iPad Pro 13" M4 256GB Wi-Fi', cat: 'Tablets', price: 47999, orig: 52999, brand: 'Apple', rating: 4.9, reviews: 312, img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400' },
    { name: 'Samsung Galaxy Tab S9 FE 128GB', cat: 'Tablets', price: 14999, orig: 17999, brand: 'Samsung', rating: 4.6, reviews: 234, img: 'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=400' },
    // Cameras
    { name: 'Sony Alpha ZV-E10 Mirrorless Camera Kit', cat: 'Cameras', price: 24999, orig: 27999, brand: 'Sony', rating: 4.8, reviews: 178, img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400' },
    { name: 'Canon EOS R50 Kit 18-45mm', cat: 'Cameras', price: 28999, orig: 33999, brand: 'Canon', rating: 4.7, reviews: 145, img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400' },
    // Watches
    { name: 'Apple Watch Series 10 44mm Aluminum', cat: 'Watches', price: 19999, orig: 22999, brand: 'Apple', rating: 4.8, reviews: 567, img: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400' },
    { name: 'Samsung Galaxy Watch 7 44mm', cat: 'Watches', price: 9999, orig: 12999, brand: 'Samsung', rating: 4.6, reviews: 345, img: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=400' },
    // Sports
    { name: 'Optimum Nutrition Gold Standard Whey 2.27kg', cat: 'Sports', price: 4999, orig: 5999, brand: 'ON', rating: 4.8, reviews: 1234, img: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400' },
    { name: 'Lifefitness T3 Treadmill', cat: 'Sports', price: 19999, orig: 24999, brand: 'LifeFitness', rating: 4.5, reviews: 67, img: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400' },
];

function jitter(base, pct = 0.08) {
    return Math.round(base * (1 + (Math.random() * 2 - 1) * pct));
}

function seedStore({ store, storeName, categories }) {
    const products = SEED_PRODUCTS
        .filter(p => categories.some(c => p.cat === c || p.cat.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(p.cat.toLowerCase())))
        .map(p => {
            const price = jitter(p.price);
            const orig  = jitter(p.orig);
            const disc  = orig > price ? Math.round((orig - price) / orig * 100) : 0;
            return {
                name:         p.name,
                description:  '',
                brand:        p.brand,
                category:     p.cat,
                basePrice:    price,
                lowestPrice:  price,
                discount:     disc,
                image:        p.img,
                stores: [{
                    store:     storeName,
                    storeName: storeName,
                    price,
                    url:       `https://www.${store.toLowerCase().replace(/[^a-z0-9]/g,'')}.com/product/${p.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,60)}`,
                    inStock:   true,
                }],
                priceHistory: [
                    { price: jitter(orig, 0.05), store: storeName, date: new Date(Date.now() - 7776e6) },
                    { price: jitter(orig, 0.03), store: storeName, date: new Date(Date.now() - 2592e6) },
                    { price,                     store: storeName, date: new Date() },
                ],
                rating:      p.rating,
                reviews:     p.reviews,
                reviewCount: p.reviews,
                tags:        [p.brand.toLowerCase(), p.cat.toLowerCase()],
                isTrending:  p.reviews > 500,
                isNew:       Math.random() > 0.7,
            };
        });
    console.log(`[Seeder] ${storeName}: ${products.length} products`);
    return { store: storeName, products };
}

function runAll() {
    return STORES.map(seedStore);
}

module.exports = { runAll, seedStore, STORES };