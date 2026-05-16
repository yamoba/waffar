export interface Product {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  brand?: string;
  model?: string;
  category: string;
  subcategory?: string;
  description?: string;
  imageUrl?: string;
  images: string[];
  specs?: Record<string, any>;
  tags: string[];
  lowestPrice?: number;
  highestPrice?: number;
  avgPrice?: number;
  listingCount: number;
  viewCount: number;
  listings?: Listing[];
  dropPercentage?: number;
  previousPrice?: number;
}

export interface Listing {
  id: string;
  productId: string;
  storeId: string;
  store: Store;
  externalUrl: string;
  price: number;
  salePrice?: number;
  inStock: boolean;
  shippingCost?: number;
  freeShipping: boolean;
  shippingDays?: number;
  installmentPlan?: { months: number; monthlyAmount: number; bank: string };
  warranty?: string;
  returnDays?: number;
  condition: string;
  rating?: number;
  reviewCount?: number;
  priceHistory?: PricePoint[];
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  nameAr: string;
  logoUrl?: string;
  rating: number;
  reviewCount: number;
}

export interface PricePoint {
  id: string;
  price: number;
  salePrice?: number;
  inStock: boolean;
  timestamp: string;
}

export interface Coupon {
  id: string;
  store: Store;
  code: string;
  description: string;
  descriptionAr?: string;
  discountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  discountValue: number;
  minOrder?: number;
  maxDiscount?: number;
  expiresAt?: string;
  isVerified: boolean;
  usageCount: number;
}

export interface Alert {
  id: string;
  productId: string;
  product: Product;
  type: "PRICE_DROP" | "PRICE_TARGET" | "BACK_IN_STOCK" | "NEW_COUPON";
  threshold?: number;
  isActive: boolean;
  lastFiredAt?: string;
}

export interface Watchlist {
  id: string;
  name: string;
  isPublic: boolean;
  items: WatchlistItem[];
  _count: { items: number };
}

export interface WatchlistItem {
  id: string;
  product: Product;
  addedAt: string;
  note?: string;
}

export interface Guide {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  category: string;
  coverImage?: string;
  viewCount: number;
  content?: string;
  contentAr?: string;
}

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  type: string;
  title: string;
  titleAr?: string;
  description?: string;
  bannerUrl?: string;
  startsAt: string;
  endsAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}
