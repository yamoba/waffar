import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ─── Stores ──────────────────────────────────────────
  const stores = await Promise.all([
    prisma.store.upsert({
      where: { slug: "amazon-eg" },
      update: {},
      create: {
        name: "Amazon.eg", slug: "amazon-eg", nameAr: "أمازون مصر",
        websiteUrl: "https://www.amazon.eg", domain: "amazon.eg",
        logoUrl: "/images/stores/amazon.svg", rating: 4.2, reviewCount: 15420,
        shippingInfo: "Free shipping on orders over 350 EGP", returnPolicy: "15-day return",
      },
    }),
    prisma.store.upsert({
      where: { slug: "noon" },
      update: {},
      create: {
        name: "Noon", slug: "noon", nameAr: "نون",
        websiteUrl: "https://www.noon.com/egypt-en/", domain: "noon.com",
        logoUrl: "/images/stores/noon.svg", rating: 4.0, reviewCount: 12300,
        shippingInfo: "Free express shipping on orders over 250 EGP", returnPolicy: "15-day return",
      },
    }),
    prisma.store.upsert({
      where: { slug: "jumia" },
      update: {},
      create: {
        name: "Jumia", slug: "jumia", nameAr: "جوميا",
        websiteUrl: "https://www.jumia.com.eg", domain: "jumia.com.eg",
        logoUrl: "/images/stores/jumia.svg", rating: 3.8, reviewCount: 18900,
        shippingInfo: "Free shipping on eligible items", returnPolicy: "14-day return",
      },
    }),
    prisma.store.upsert({
      where: { slug: "btech" },
      update: {},
      create: {
        name: "B.Tech", slug: "btech", nameAr: "بي.تك",
        websiteUrl: "https://btech.com", domain: "btech.com",
        logoUrl: "/images/stores/btech.svg", rating: 4.3, reviewCount: 8700,
        shippingInfo: "Free delivery to all governorates", returnPolicy: "14-day return",
      },
    }),
    prisma.store.upsert({
      where: { slug: "2b" },
      update: {},
      create: {
        name: "2B", slug: "2b", nameAr: "تو بي",
        websiteUrl: "https://www.2b.com.eg", domain: "2b.com.eg",
        logoUrl: "/images/stores/2b.svg", rating: 4.1, reviewCount: 5600,
        shippingInfo: "Delivery within 3-5 days", returnPolicy: "7-day return",
      },
    }),
    prisma.store.upsert({
      where: { slug: "carrefour-eg" },
      update: {},
      create: {
        name: "Carrefour Egypt", slug: "carrefour-eg", nameAr: "كارفور مصر",
        websiteUrl: "https://www.carrefouregypt.com", domain: "carrefouregypt.com",
        logoUrl: "/images/stores/carrefour.svg", rating: 3.9, reviewCount: 6200,
        shippingInfo: "Same-day delivery in Cairo/Giza", returnPolicy: "30-day return",
      },
    }),
    prisma.store.upsert({
      where: { slug: "electronia" },
      update: {},
      create: {
        name: "Electronia", slug: "electronia", nameAr: "الكترونيا",
        websiteUrl: "https://electronia.co", domain: "electronia.co",
        logoUrl: "/images/stores/electronia.svg", rating: 4.0, reviewCount: 3400,
        shippingInfo: "Free shipping on orders over 500 EGP", returnPolicy: "14-day return",
      },
    }),
  ]);

  console.log(`Seeded ${stores.length} stores`);

  // ─── Sample Products ─────────────────────────────────
  const products = [
    {
      title: "iPhone 15 Pro Max 256GB", titleAr: "ايفون 15 برو ماكس 256 جيجا", slug: "iphone-15-pro-max-256gb",
      brand: "Apple", model: "A3101", category: "Smartphones", subcategory: "iPhone",
      imageUrl: "/images/products/iphone15promax.webp",
      specs: { storage: "256GB", ram: "8GB", display: "6.7 inches", chip: "A17 Pro", camera: "48MP + 12MP + 12MP" },
      tags: ["iphone", "apple", "smartphone", "5g"],
    },
    {
      title: "Samsung Galaxy S24 Ultra 256GB", titleAr: "سامسونج جالاكسي اس 24 الترا 256 جيجا", slug: "samsung-galaxy-s24-ultra-256gb",
      brand: "Samsung", model: "SM-S928B", category: "Smartphones", subcategory: "Samsung Galaxy",
      imageUrl: "/images/products/s24ultra.webp",
      specs: { storage: "256GB", ram: "12GB", display: "6.8 inches", chip: "Snapdragon 8 Gen 3", camera: "200MP + 50MP + 12MP + 10MP" },
      tags: ["samsung", "galaxy", "smartphone", "5g", "s-pen"],
    },
    {
      title: 'MacBook Air M3 15" 256GB', titleAr: 'ماك بوك اير ام 3 15 بوصة 256 جيجا', slug: "macbook-air-m3-15-256gb",
      brand: "Apple", model: "MRXN3", category: "Laptops", subcategory: "MacBook",
      imageUrl: "/images/products/macbookairm3.webp",
      specs: { storage: "256GB SSD", ram: "8GB", display: "15.3 inches", chip: "Apple M3", battery: "18 hours" },
      tags: ["macbook", "apple", "laptop", "ultrabook"],
    },
    {
      title: "PlayStation 5 Slim Digital Edition", titleAr: "بلايستيشن 5 سليم ديجيتال", slug: "ps5-slim-digital",
      brand: "Sony", model: "CFI-2000", category: "Gaming", subcategory: "Consoles",
      imageUrl: "/images/products/ps5slim.webp",
      specs: { storage: "1TB SSD", resolution: "4K 120Hz", features: "Ray Tracing, Haptic Feedback" },
      tags: ["ps5", "playstation", "gaming", "console", "sony"],
    },
    {
      title: "LG 55-inch OLED 4K Smart TV", titleAr: "ال جي تلفزيون 55 بوصة اوليد 4K", slug: "lg-55-oled-4k-c3",
      brand: "LG", model: "OLED55C3PUA", category: "TVs", subcategory: "OLED TV",
      imageUrl: "/images/products/lgoled55.webp",
      specs: { display: '55" OLED', resolution: "4K", hdr: "Dolby Vision, HDR10", smart: "webOS 23" },
      tags: ["tv", "oled", "lg", "4k", "smart tv"],
    },
    {
      title: "AirPods Pro 2nd Generation USB-C", titleAr: "ايربودز برو الجيل الثاني يو اس بي سي", slug: "airpods-pro-2-usbc",
      brand: "Apple", model: "MTJV3", category: "Audio", subcategory: "Earbuds",
      imageUrl: "/images/products/airpodspro2.webp",
      specs: { anc: "Active Noise Cancellation", battery: "6 hours (30 with case)", connectivity: "Bluetooth 5.3" },
      tags: ["airpods", "apple", "earbuds", "wireless", "anc"],
    },
    {
      title: "Dyson V15 Detect Absolute Vacuum", titleAr: "دايسون في 15 مكنسة كهربائية", slug: "dyson-v15-detect-absolute",
      brand: "Dyson", model: "V15", category: "Home Appliances", subcategory: "Vacuums",
      imageUrl: "/images/products/dysonv15.webp",
      specs: { power: "230AW", runtime: "60 min", features: "Laser dust detection, LCD screen" },
      tags: ["dyson", "vacuum", "cordless", "home"],
    },
    {
      title: "Samsung 650L French Door Refrigerator", titleAr: "سامسونج ثلاجة 650 لتر فرنش دور", slug: "samsung-650l-french-door-fridge",
      brand: "Samsung", model: "RF59A70T3S9", category: "Home Appliances", subcategory: "Refrigerators",
      imageUrl: "/images/products/samsung-fridge.webp",
      specs: { capacity: "650L", type: "French Door", inverter: true, energyRating: "A++" },
      tags: ["samsung", "fridge", "refrigerator", "home appliance"],
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  console.log(`Seeded ${products.length} products`);

  // ─── Sample Listings ─────────────────────────────────
  const allProducts = await prisma.product.findMany();
  const allStores = await prisma.store.findMany();

  const priceRanges: Record<string, [number, number]> = {
    "Smartphones": [1500000, 8500000],
    "Laptops": [2000000, 12000000],
    "Gaming": [1500000, 4000000],
    "TVs": [800000, 6000000],
    "Audio": [100000, 1500000],
    "Home Appliances": [300000, 5000000],
  };

  for (const product of allProducts) {
    const range = priceRanges[product.category] || [100000, 2000000];
    const basePrice = Math.floor(Math.random() * (range[1] - range[0]) + range[0]);

    const storeSubset = allStores
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 4) + 2);

    for (const store of storeSubset) {
      const variation = Math.floor(basePrice * (Math.random() * 0.2 - 0.1));
      const price = basePrice + variation;
      const hasSale = Math.random() > 0.7;
      const salePrice = hasSale ? Math.floor(price * (0.85 + Math.random() * 0.1)) : null;

      const listing = await prisma.listing.upsert({
        where: { productId_storeId_externalId: { productId: product.id, storeId: store.id, externalId: `${store.slug}-${product.slug}` } },
        update: {},
        create: {
          productId: product.id,
          storeId: store.id,
          externalId: `${store.slug}-${product.slug}`,
          externalUrl: `${store.websiteUrl}/product/${product.slug}`,
          price,
          salePrice,
          inStock: Math.random() > 0.1,
          shippingCost: Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 5000 + 2000),
          freeShipping: Math.random() > 0.5,
          shippingDays: Math.floor(Math.random() * 5) + 1,
          returnDays: store.slug === "carrefour-eg" ? 30 : 14,
          installmentPlan: Math.random() > 0.5 ? { months: 12, monthlyAmount: Math.floor(price / 12), bank: "CIB" } : null,
          warranty: "1 year manufacturer warranty",
          rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
          reviewCount: Math.floor(Math.random() * 500),
          lastScrapedAt: new Date(),
        },
      });

      // Generate price history (last 30 days)
      for (let day = 30; day >= 0; day--) {
        const historyPrice = Math.floor(price * (0.95 + Math.random() * 0.1));
        await prisma.priceHistory.create({
          data: {
            productId: product.id,
            listingId: listing.id,
            price: historyPrice,
            salePrice: day < 7 ? salePrice : null,
            inStock: true,
            timestamp: new Date(Date.now() - day * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  }

  console.log("Seeded listings and price history");

  // ─── Update aggregates ───────────────────────────────
  for (const product of allProducts) {
    const listings = await prisma.listing.findMany({
      where: { productId: product.id, isActive: true },
    });
    const prices = listings.map((l) => l.salePrice ?? l.price);
    if (prices.length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          lowestPrice: Math.min(...prices),
          highestPrice: Math.max(...prices),
          avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          listingCount: listings.length,
        },
      });
    }
  }

  // ─── Sample Coupons ──────────────────────────────────
  for (const store of allStores) {
    await prisma.coupon.create({
      data: {
        storeId: store.id,
        code: `WAFFAR${store.slug.toUpperCase().replace(/-/g, "")}`,
        description: `Get 10% off on ${store.name}`,
        descriptionAr: `خصم 10% على ${store.nameAr}`,
        discountType: "PERCENTAGE",
        discountValue: 10,
        minOrder: 50000,
        isVerified: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Seeded coupons");

  // ─── Admin User ──────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123456", 12);
  await prisma.user.upsert({
    where: { email: "admin@waffar.co" },
    update: {},
    create: {
      email: "admin@waffar.co",
      name: "Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      tier: "PREMIUM",
      isVerified: true,
      referralCode: "ADMIN001",
    },
  });

  console.log("Seeded admin user (admin@waffar.co / admin123456)");

  // ─── Sample Guide ────────────────────────────────────
  await prisma.guide.upsert({
    where: { slug: "best-smartphones-egypt-2024" },
    update: {},
    create: {
      title: "Best Smartphones in Egypt 2024",
      titleAr: "أفضل الهواتف الذكية في مصر 2024",
      slug: "best-smartphones-egypt-2024",
      content: "A comprehensive guide to the best smartphones available in Egypt...",
      contentAr: "دليل شامل لأفضل الهواتف الذكية المتوفرة في مصر...",
      category: "Smartphones",
      isPublished: true,
    },
  });

  console.log("Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
