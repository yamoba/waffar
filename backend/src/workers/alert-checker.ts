import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";

export async function checkAlerts() {
  logger.info("Running alert checker...");

  const alerts = await prisma.alert.findMany({
    where: { isActive: true },
    include: {
      product: { include: { listings: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 } } },
      user: { select: { id: true, email: true, name: true } },
    },
  });

  for (const alert of alerts) {
    const currentPrice = alert.product.listings[0]?.price;
    if (!currentPrice) continue;

    let shouldFire = false;
    let message = "";

    switch (alert.type) {
      case "PRICE_DROP": {
        const previousPrice = await prisma.priceHistory.findFirst({
          where: { productId: alert.productId },
          orderBy: { timestamp: "desc" },
          skip: 1,
        });
        if (previousPrice && currentPrice < previousPrice.price) {
          const drop = ((previousPrice.price - currentPrice) / previousPrice.price * 100).toFixed(1);
          shouldFire = true;
          message = `${alert.product.title} dropped ${drop}% — now ${(currentPrice / 100).toFixed(2)} EGP`;
        }
        break;
      }
      case "PRICE_TARGET": {
        if (alert.threshold && currentPrice <= alert.threshold) {
          shouldFire = true;
          message = `${alert.product.title} reached your target price: ${(currentPrice / 100).toFixed(2)} EGP`;
        }
        break;
      }
      case "BACK_IN_STOCK": {
        const wasOutOfStock = alert.product.listings.length === 0;
        if (!wasOutOfStock && alert.product.listings[0]?.inStock) {
          shouldFire = true;
          message = `${alert.product.title} is back in stock!`;
        }
        break;
      }
    }

    if (shouldFire) {
      await prisma.notification.create({
        data: {
          userId: alert.user.id,
          type: alert.type,
          title: alert.type === "PRICE_DROP" ? "سعر أقل!" : alert.type === "PRICE_TARGET" ? "وصل للسعر المطلوب!" : "رجع في المخزون!",
          body: message,
          data: { productId: alert.productId, productSlug: alert.product.slug },
        },
      });

      await prisma.alert.update({
        where: { id: alert.id },
        data: { lastFiredAt: new Date() },
      });

      logger.info(`Alert fired: ${alert.type} for user ${alert.user.id}, product ${alert.productId}`);
    }
  }

  logger.info(`Alert check complete. Checked ${alerts.length} alerts.`);
}

if (require.main === module) {
  checkAlerts().then(() => process.exit(0)).catch((e) => { logger.error(e); process.exit(1); });
}
