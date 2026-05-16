import { prisma } from "../config/prisma";
import { redis } from "../config/redis";
import { logger } from "../utils/logger";

export async function updateProductAggregates() {
  logger.info("Updating product price aggregates...");

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { listings: { where: { isActive: true } } },
  });

  let updated = 0;

  for (const product of products) {
    const prices = product.listings.map((l) => l.salePrice ?? l.price).filter((p) => p > 0);
    if (prices.length === 0) continue;

    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    if (product.lowestPrice !== lowestPrice || product.highestPrice !== highestPrice || product.listingCount !== product.listings.length) {
      await prisma.product.update({
        where: { id: product.id },
        data: { lowestPrice, highestPrice, avgPrice, listingCount: product.listings.length },
      });
      updated++;
    }
  }

  // Invalidate caches
  await redis.del("trending_products", "biggest_drops", "deal_of_day");

  logger.info(`Updated ${updated} product aggregates out of ${products.length}`);
}

if (require.main === module) {
  updateProductAggregates().then(() => process.exit(0)).catch((e) => { logger.error(e); process.exit(1); });
}
