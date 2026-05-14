const mongoose = require('mongoose');

const aiSearchSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    query: {
        type: String,
        required: true,
        trim: true
    },
    results: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        relevanceScore: Number,
        aiExplanation: String
    }],
    aiResponse: {
        type: String,
        trim: true
    },
    tokensUsed: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('AISearch', aiSearchSchema);
