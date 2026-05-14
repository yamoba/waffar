const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
    price: { type: Number, required: true },
    store: { type: String },
    date: { type: Date, default: Date.now }
}, { _id: false });

const storeSchema = new mongoose.Schema({
    store: { type: String },
    storeName: { type: String },
    price: { type: Number },
    url: { type: String, default: '#' },
    inStock: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    brand: { type: String, trim: true },
    category: {
        type: String,
        required: true,
        enum: ['Electronics', 'Fashion', 'Home & Garden', 'Home Appliances', 'Sports',
               'Beauty', 'Food', 'Other', 'Phones', 'Laptops', 'Gaming', 'Cameras',
               'Audio', 'Tablets', 'Watches', 'Books', 'Toys', 'Automotive'],
        index: true
    },
    basePrice: { type: Number, required: true, min: 0 },
    lowestPrice: { type: Number },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    image: { type: String, default: null },
    stores: [storeSchema],
    priceHistory: [priceHistorySchema],
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    tags: [{ type: String }],
    isTrending: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
});

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

productSchema.pre('save', function(next) {
    if (this.stores && this.stores.length > 0) {
        const prices = this.stores.map(s => s.price).filter(p => p > 0);
        if (prices.length > 0) {
            this.lowestPrice = Math.min(...prices);
        }
    }
    if (!this.lowestPrice) this.lowestPrice = this.basePrice;
    this.reviewCount = this.reviews || this.reviewCount || 0;
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Product', productSchema);