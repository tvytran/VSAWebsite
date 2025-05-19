const mongoose = require('mongoose');


const pointsHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    family: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Family',
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['hangout_attendance', 'event_participation', 'manual_adjustment'],
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    // Reference to the related post if points are from a hangout
    relatedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    // Who authorized the points (for manual adjustments)
    authorizedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying of user's points history
pointsHistorySchema.index({ user: 1, createdAt: -1 });

// Index for efficient querying of family's points history
pointsHistorySchema.index({ family: 1, createdAt: -1 });

const PointsHistory = mongoose.model('PointsHistory', pointsHistorySchema);

module.exports = PointsHistory; 