const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    family: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Family'
    },
    points: {
        total: {
            type: Number,
            default: 0
        },
        semester: {
            type: Number,
            default: 0
        }
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
    },
    profilePicture: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Method to update points
userSchema.methods.updatePoints = async function(pointsToAdd) {
    this.points.total += pointsToAdd;
    this.points.semester += pointsToAdd;
    return this.save();
};

// Method to reset semester points
userSchema.methods.resetSemesterPoints = async function() {
    this.points.semester = 0;
    return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 