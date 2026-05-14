'use strict';
const STORES = [
    { store: 'Noon',        storeName: 'Noon',         categories: ['Electronics','Phones','Laptops','Fashion','Beauty','Watches','Tablets','Cameras'] },
    { store: 'Carrefour',   storeName: 'Carrefour',    categories: ['Appliances','Grocery','Electronics','Baby','Sports','Home','Kitchen'] },
    { store: 'B.TECH',      storeName: 'B.TECH',       categories: ['Phones','Laptops','Tablets','Audio','Gaming','Cameras','Accessories'] },
    { store: '2B',          storeName: '2B Egypt',     categories: ['Phones','Laptops','Tablets','Audio','Gaming','Accessories'] },
    { store: 'El Araby',    storeName: 'El Araby',     categories: ['Appliances','TVs','Electronics','Audio','Home'] },
    { store: 'Raneen',      storeName: 'Raneen',       categories: ['Furniture','Home','Kitchen','Bathroom','Decor'] },
    { store: 'Homzmart',    storeName: 'Homzmart',     categories: ['Furniture','Home','Lighting','Decor','Kitchen'] },
    { store: 'Namshi',      storeName: 'Namshi',       categories: ['Fashion','Shoes','Bags','Beauty','Accessories'] },
    { store: 'IKEA',        storeName: 'IKEA Egypt',   categories: ['Furniture','Storage','Lighting','Textiles','Kitchen','Decor'] },
    { store: 'H&M',         storeName: 'H&M Egypt',    categories: ['Fashion','Kids','Sports','Accessories','Home'] },
    { store: 'eXtra',       storeName: 'eXtra',        categories: ['Phones','Laptops','Tablets','Gaming','Audio','Accessories'] },
    { store: 'RadioShack',  storeName: 'RadioShack',   categories: ['Electronics','Audio','Accessories','Smart Home'] },
    { store: 'Tradeline',   storeName: 'Tradeline',    categories: ['Appliances','TVs','Electronics','Kitchen'] },
];

// Generate 500+ realistic Egyptian market products
function generateProducts() {
    const brands = {
        Phones: ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Realme', 'Huawei', 'OnePlus', 'Motorola', 'Nothing'],
        Laptops: ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI', 'Razer'],
        TVs: ['Samsung', 'LG', 'TCL', 'Hisense', 'Sony', 'Panasonic', 'Toshiba'],
        Audio: ['Sony', 'Apple', 'Samsung', 'JBL', 'Beats', 'Bose', 'Sennheiser', 'Audio-Technica'],
        Appliances: ['Samsung', 'LG', 'Toshiba', 'Carrier', 'Dyson', 'Philips', 'Arcelik', 'Electrolux'],
        Gaming: ['Sony', 'Microsoft', 'Nintendo'],
        Fashion: ['Nike', 'Adidas', 'Zara', 'Levi\'s', 'Tommy Hilfiger', 'H&M', 'Forever 21', 'Ralph Lauren'],
        Beauty: ['L\'Oreal', 'Chanel', 'Dior', 'Estee Lauder', 'CeraVe', 'Olay', 'Maybelline', 'MAC'],
        Furniture: ['IKEA', 'Raneen', 'Homzmart', 'HomeMax', 'Poltrona Frau'],
        Tablets: ['Apple', 'Samsung', 'Lenovo', 'Microsoft'],
        Cameras: ['Sony', 'Canon', 'Nikon', 'Fujifilm', 'GoPro'],
        Watches: ['Apple', 'Samsung', 'Casio', 'Fossil', 'Seiko', 'Garmin'],
        Sports: ['Nike', 'Adidas', 'Puma', 'Reebok', 'Decathlon', 'Optimum Nutrition'],
        Home: ['IKEA', 'Raneen', 'Homzmart', 'Namshi'],
        Kitchen: ['Philips', 'Dyson', 'KitchenAid', 'De\'Longhi'],
        Accessories: ['Spigen', 'Anker', 'Belkin', 'OtterBox'],
    };

    const products = [];

    // Phones (80 products)
    const phoneModels = [
        { name: 'iPhone 16 Pro Max 256GB', base: 52999, brand: 'Apple', rating: 4.8 },
        { name: 'iPhone 16 Pro 256GB', base: 42999, brand: 'Apple', rating: 4.8 },
        { name: 'iPhone 16 128GB', base: 32999, brand: 'Apple', rating: 4.7 },
        { name: 'iPhone 15 Pro 128GB', base: 38999, brand: 'Apple', rating: 4.7 },
        { name: 'Samsung Galaxy S25 Ultra', base: 48999, brand: 'Samsung', rating: 4.6 },
        { name: 'Samsung Galaxy S25+', base: 39999, brand: 'Samsung', rating: 4.6 },
        { name: 'Samsung Galaxy S25', base: 32999, brand: 'Samsung', rating: 4.5 },
        { name: 'Samsung Galaxy A55', base: 14999, brand: 'Samsung', rating: 4.4 },
        { name: 'Xiaomi 14 Ultra', base: 27999, brand: 'Xiaomi', rating: 4.5 },
        { name: 'Xiaomi 14', base: 21999, brand: 'Xiaomi', rating: 4.4 },
        { name: 'Xiaomi Redmi Note 13 Pro', base: 11999, brand: 'Xiaomi', rating: 4.5 },
        { name: 'OPPO Find X7 Ultra', base: 29999, brand: 'OPPO', rating: 4.5 },
        { name: 'OPPO Reno 12 Pro', base: 17999, brand: 'OPPO', rating: 4.3 },
        { name: 'Realme 12 Pro+', base: 14499, brand: 'Realme', rating: 4.2 },
        { name: 'OnePlus 13', base: 24999, brand: 'OnePlus', rating: 4.6 },
        { name: 'Motorola Edge 50 Pro', base: 19999, brand: 'Motorola', rating: 4.4 },
        { name: 'Nothing Phone 2a', base: 13999, brand: 'Nothing', rating: 4.3 },
        { name: 'Huawei Pura 70', base: 23999, brand: 'Huawei', rating: 4.4 },
    ];

    for (let i = 0; i < 80; i++) {
        const model = phoneModels[i % phoneModels.length];
        products.push({
            name: model.name + ` Variant ${Math.floor(i / phoneModels.length) + 1}`,
            cat: 'Phones',
            price: model.base + (Math.random() * 2000 - 1000),
            orig: model.base + 5000 + (Math.random() * 2000),
            brand: model.brand,
            rating: Math.min(5, model.rating + (Math.random() * 0.3 - 0.15)),
            reviews: Math.floor(100 + Math.random() * 2000),
            img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
        });
    }

    // Laptops (60 products)
    const laptopModels = [
        { name: 'MacBook Air M4 13"', base: 42999 },
        { name: 'MacBook Pro M4 14"', base: 67999 },
        { name: 'MacBook Pro M4 16"', base: 89999 },
        { name: 'Dell XPS 15 i7', base: 52999 },
        { name: 'Dell XPS 13 Plus', base: 34999 },
        { name: 'HP Spectre x360', base: 41999 },
        { name: 'Lenovo ThinkPad X1', base: 58999 },
        { name: 'ASUS ZenBook 14', base: 26999 },
        { name: 'ASUS ROG Zephyrus', base: 55999 },
        { name: 'Acer Swift 5', base: 24999 },
    ];
    for (let i = 0; i < 60; i++) {
        const model = laptopModels[i % laptopModels.length];
        products.push({
            name: model.name + ` Config ${i % 6}`,
            cat: 'Laptops',
            price: model.base + (Math.random() * 5000 - 2500),
            orig: model.base + 8000 + (Math.random() * 3000),
            brand: model.name.split(' ')[0],
            rating: 4.5 + Math.random() * 0.4,
            reviews: Math.floor(100 + Math.random() * 1500),
            img: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400'
        });
    }

    // TVs (40 products)
    const tvModels = [
        { name: 'Samsung 85" QLED', base: 64999 },
        { name: 'Samsung 75" QLED', base: 44999 },
        { name: 'Samsung 65" QLED', base: 34999 },
        { name: 'LG 77" OLED', base: 59999 },
        { name: 'LG 65" OLED', base: 39999 },
        { name: 'TCL 75" QLED', base: 24999 },
        { name: 'Sony 75" Bravia', base: 54999 },
        { name: 'Hisense 55" ULED', base: 13999 },
    ];
    for (let i = 0; i < 40; i++) {
        const model = tvModels[i % tvModels.length];
        products.push({
            name: model.name + ` 2024 Model ${i % 5}`,
            cat: 'TVs',
            price: model.base + (Math.random() * 3000 - 1500),
            orig: model.base + 5000 + Math.random() * 2000,
            brand: model.name.split(' ')[0],
            rating: 4.4 + Math.random() * 0.5,
            reviews: Math.floor(80 + Math.random() * 1000),
            img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400'
        });
    }

    // Audio (50 products)
    const audioModels = [
        { name: 'Sony WH-1000XM5', base: 14999 },
        { name: 'Sony WH-CH520', base: 1999 },
        { name: 'Apple AirPods Pro', base: 11999 },
        { name: 'Apple AirPods Max', base: 27999 },
        { name: 'Samsung Galaxy Buds3', base: 8999 },
        { name: 'JBL Charge 5', base: 4299 },
        { name: 'Beats Studio Pro', base: 16999 },
        { name: 'Sennheiser Momentum 4', base: 12999 },
        { name: 'Bose QuietComfort Ultra', base: 18999 },
    ];
    for (let i = 0; i < 50; i++) {
        const model = audioModels[i % audioModels.length];
        products.push({
            name: model.name + ` Color ${i % 5}`,
            cat: 'Audio',
            price: model.base + (Math.random() * 1000 - 500),
            orig: model.base + 2000 + Math.random() * 1000,
            brand: model.name.split(' ')[0],
            rating: 4.6 + Math.random() * 0.3,
            reviews: Math.floor(200 + Math.random() * 2000),
            img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
        });
    }

    // Appliances (60 products)
    const applianceModels = [
        { name: 'Samsung Washer 24kg', base: 18999 },
        { name: 'LG Refrigerator 28ft', base: 22999 },
        { name: 'Carrier AC 1.5HP', base: 11999 },
        { name: 'Dyson V15 Vacuum', base: 19999 },
        { name: 'Philips Air Fryer 7L', base: 6499 },
        { name: 'De\'Longhi Espresso', base: 8999 },
        { name: 'Toshiba Microwave 20L', base: 2999 },
        { name: 'Arcelik Oven 90L', base: 5999 },
    ];
    for (let i = 0; i < 60; i++) {
        const model = applianceModels[i % applianceModels.length];
        products.push({
            name: model.name + ` Model ${i % 8}`,
            cat: 'Appliances',
            price: model.base + (Math.random() * 2000 - 1000),
            orig: model.base + 3000 + Math.random() * 2000,
            brand: model.name.split(' ')[0],
            rating: 4.3 + Math.random() * 0.5,
            reviews: Math.floor(50 + Math.random() * 1000),
            img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
        });
    }

    // Gaming (30 products)
    const gamingModels = [
        { name: 'PlayStation 5', base: 24999 },
        { name: 'Xbox Series X', base: 22999 },
        { name: 'Nintendo Switch OLED', base: 14999 },
        { name: 'Xbox Game Pass 3m', base: 99 },
        { name: 'PS5 Controller DualSense', base: 4999 },
    ];
    for (let i = 0; i < 30; i++) {
        const model = gamingModels[i % gamingModels.length];
        products.push({
            name: model.name + ` Version ${i % 6}`,
            cat: 'Gaming',
            price: model.base + (Math.random() * 1000 - 500),
            orig: model.base + 2000 + Math.random() * 1000,
            brand: model.name.includes('PlayStation') ? 'Sony' : model.name.includes('Xbox') ? 'Microsoft' : 'Nintendo',
            rating: 4.7 + Math.random() * 0.2,
            reviews: Math.floor(300 + Math.random() * 2000),
            img: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400'
        });
    }

    // Fashion (80 products)
    const fashionModels = [
        { name: 'Nike Air Max 90', base: 2999, brand: 'Nike' },
        { name: 'Adidas Ultraboost', base: 3999, brand: 'Adidas' },
        { name: 'Zara Blazer', base: 1999, brand: 'Zara' },
        { name: 'Levi\'s 501 Jeans', base: 1499, brand: 'Levi\'s' },
        { name: 'Tommy Hilfiger Polo', base: 999, brand: 'Tommy' },
        { name: 'H&M T-Shirt', base: 299, brand: 'H&M' },
        { name: 'Puma Running Shoes', base: 2499, brand: 'Puma' },
        { name: 'Reebok Classic', base: 1999, brand: 'Reebok' },
    ];
    for (let i = 0; i < 80; i++) {
        const model = fashionModels[i % fashionModels.length];
        products.push({
            name: model.name + ` Size/Color ${i % 10}`,
            cat: 'Fashion',
            price: model.base + (Math.random() * 500 - 250),
            orig: model.base + 800 + Math.random() * 400,
            brand: model.brand,
            rating: 4.3 + Math.random() * 0.4,
            reviews: Math.floor(200 + Math.random() * 1500),
            img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'
        });
    }

    // Beauty (50 products)
    const beautyModels = [
        { name: 'L\'Oreal Serum 30ml', base: 599, brand: 'L\'Oreal' },
        { name: 'Chanel No.5 100ml', base: 5999, brand: 'Chanel' },
        { name: 'Dior Lipstick', base: 2999, brand: 'Dior' },
        { name: 'CeraVe Cleanser', base: 399, brand: 'CeraVe' },
        { name: 'Olay Moisturizer', base: 299, brand: 'Olay' },
        { name: 'MAC Foundation', base: 1999, brand: 'MAC' },
        { name: 'Maybelline Mascara', base: 199, brand: 'Maybelline' },
        { name: 'Estee Lauder Eye Cream', base: 3999, brand: 'Estee' },
    ];
    for (let i = 0; i < 50; i++) {
        const model = beautyModels[i % beautyModels.length];
        products.push({
            name: model.name + ` Shade ${i % 6}`,
            cat: 'Beauty',
            price: model.base + (Math.random() * 300 - 150),
            orig: model.base + 500 + Math.random() * 300,
            brand: model.brand,
            rating: 4.4 + Math.random() * 0.5,
            reviews: Math.floor(300 + Math.random() * 1500),
            img: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400'
        });
    }

    // Furniture (50 products)
    const furnitureModels = [
        { name: 'IKEA POÄNG Chair', base: 3499, brand: 'IKEA' },
        { name: 'Sectional Sofa Gray', base: 14999, brand: 'HomeMax' },
        { name: 'King Bed Frame', base: 9999, brand: 'Raneen' },
        { name: 'Dining Table 6 seater', base: 7999, brand: 'Homzmart' },
        { name: 'Bookshelf 5 tier', base: 2999, brand: 'IKEA' },
    ];
    for (let i = 0; i < 50; i++) {
        const model = furnitureModels[i % furnitureModels.length];
        products.push({
            name: model.name + ` Design ${i % 5}`,
            cat: 'Furniture',
            price: model.base + (Math.random() * 1000 - 500),
            orig: model.base + 2000 + Math.random() * 1000,
            brand: model.brand,
            rating: 4.3 + Math.random() * 0.4,
            reviews: Math.floor(50 + Math.random() * 500),
            img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400'
        });
    }

    // Tablets (30 products)
    const tabletModels = [
        { name: 'iPad Pro 13"', base: 47999 },
        { name: 'iPad Air 11"', base: 31999 },
        { name: 'iPad 10"', base: 15999 },
        { name: 'Samsung Tab S9 FE', base: 14999 },
        { name: 'Lenovo Tab P12 Pro', base: 24999 },
    ];
    for (let i = 0; i < 30; i++) {
        const model = tabletModels[i % tabletModels.length];
        products.push({
            name: model.name + ` Storage ${i % 4}`,
            cat: 'Tablets',
            price: model.base + (Math.random() * 2000 - 1000),
            orig: model.base + 3000 + Math.random() * 2000,
            brand: model.name.includes('iPad') ? 'Apple' : model.name.includes('Tab') ? 'Samsung' : 'Lenovo',
            rating: 4.6 + Math.random() * 0.3,
            reviews: Math.floor(150 + Math.random() * 800),
            img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'
        });
    }

    // Cameras (25 products)
    const cameraModels = [
        { name: 'Sony Alpha ZV-E10', base: 24999 },
        { name: 'Canon EOS R50', base: 28999 },
        { name: 'Nikon Z30', base: 29999 },
        { name: 'GoPro Hero 13', base: 12999 },
        { name: 'Fujifilm X-S20', base: 31999 },
    ];
    for (let i = 0; i < 25; i++) {
        const model = cameraModels[i % cameraModels.length];
        products.push({
            name: model.name + ` Kit ${i % 3}`,
            cat: 'Cameras',
            price: model.base + (Math.random() * 2000 - 1000),
            orig: model.base + 3000 + Math.random() * 2000,
            brand: model.name.split(' ')[0],
            rating: 4.7 + Math.random() * 0.2,
            reviews: Math.floor(100 + Math.random() * 600),
            img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400'
        });
    }

    // Watches (30 products)
    const watchModels = [
        { name: 'Apple Watch Series 10', base: 19999 },
        { name: 'Samsung Galaxy Watch 7', base: 9999 },
        { name: 'Casio G-Shock', base: 2999 },
        { name: 'Fossil Gen 6', base: 7999 },
        { name: 'Garmin Epix', base: 24999 },
        { name: 'Seiko Prospex', base: 8999 },
    ];
    for (let i = 0; i < 30; i++) {
        const model = watchModels[i % watchModels.length];
        products.push({
            name: model.name + ` Color ${i % 5}`,
            cat: 'Watches',
            price: model.base + (Math.random() * 1000 - 500),
            orig: model.base + 2000 + Math.random() * 1000,
            brand: model.name.split(' ')[0],
            rating: 4.5 + Math.random() * 0.4,
            reviews: Math.floor(100 + Math.random() * 1000),
            img: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400'
        });
    }

    // Sports (40 products)
    const sportsModels = [
        { name: 'Nike Running Shoe', base: 2999, brand: 'Nike' },
        { name: 'Adidas Training Shorts', base: 699, brand: 'Adidas' },
        { name: 'Decathlon Yoga Mat', base: 499, brand: 'Decathlon' },
        { name: 'Puma Tank Top', base: 399, brand: 'Puma' },
        { name: 'ON Whey Protein 2.27kg', base: 4999, brand: 'ON' },
        { name: 'Fitbit Smartwatch', base: 11999, brand: 'Fitbit' },
        { name: 'Reebok Dumbbell 20kg', base: 1999, brand: 'Reebok' },
    ];
    for (let i = 0; i < 40; i++) {
        const model = sportsModels[i % sportsModels.length];
        products.push({
            name: model.name + ` Variant ${i % 4}`,
            cat: 'Sports',
            price: model.base + (Math.random() * 500 - 250),
            orig: model.base + 1000 + Math.random() * 500,
            brand: model.brand,
            rating: 4.4 + Math.random() * 0.4,
            reviews: Math.floor(100 + Math.random() * 1000),
            img: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400'
        });
    }

    // Kitchen (30 products)
    const kitchenModels = [
        { name: 'Philips Blender', base: 1999, brand: 'Philips' },
        { name: 'KitchenAid Mixer', base: 6999, brand: 'KitchenAid' },
        { name: 'De\'Longhi Coffee', base: 8999, brand: 'De\'Longhi' },
        { name: 'Tefal Pan Set', base: 1499, brand: 'Tefal' },
        { name: 'Tramontina Knives', base: 2999, brand: 'Tramontina' },
        { name: 'Le Creuset Pot', base: 4999, brand: 'Le Creuset' },
    ];
    for (let i = 0; i < 30; i++) {
        const model = kitchenModels[i % kitchenModels.length];
        products.push({
            name: model.name + ` Model ${i % 5}`,
            cat: 'Kitchen',
            price: model.base + (Math.random() * 500 - 250),
            orig: model.base + 1000 + Math.random() * 500,
            brand: model.brand,
            rating: 4.5 + Math.random() * 0.3,
            reviews: Math.floor(80 + Math.random() * 600),
            img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'
        });
    }

    return products;
}

const SEED_PRODUCTS = generateProducts();

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
                description:  `High-quality ${p.cat} product from ${storeName}`,
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
                    inStock:   Math.random() > 0.1,
                }],
                priceHistory: [
                    { price: jitter(orig, 0.05), store: storeName, date: new Date(Date.now() - 7776e6) },
                    { price: jitter(orig, 0.03), store: storeName, date: new Date(Date.now() - 2592e6) },
                    { price,                     store: storeName, date: new Date() },
                ],
                rating:      Math.max(3.5, Math.min(5, p.rating || (3.5 + Math.random() * 1.5))),
                reviews:     p.reviews || Math.floor(50 + Math.random() * 2000),
                reviewCount: p.reviews || Math.floor(50 + Math.random() * 2000),
                tags:        [p.brand.toLowerCase(), p.cat.toLowerCase()],
                isTrending:  (p.reviews || 100) > 500,
                isNew:       Math.random() > 0.8,
                isFeatured:  Math.random() > 0.85,
            };
        });
    console.log(`[Seeder] ${storeName}: ${products.length} products`);
    return { store: storeName, products };
}

function runAll() {
    return STORES.map(seedStore);
}

module.exports = { runAll, seedStore, STORES };
