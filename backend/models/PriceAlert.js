const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String, required: true, trim: true },
    targetPrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number },
    isActive: { type: Boolean, default: true, index: true },
    notified: { type: Boolean, default: false },
    notifiedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PriceAlert', priceAlertSchema);