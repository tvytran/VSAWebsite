const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    family: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Family',
        required: true
    },
    type: {
        type: String,
        enum: ['post', 'hangout', 'announcement'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    // Hangout-specific fields
    hangoutDetails: {
        date: Date,
        location: String,
        maxAttendees: Number,
        pointValue: {
            type: Number,
            default: 0
        },
        attendees: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            status: {
                type: String,
                enum: ['attending', 'maybe', 'not_attending'],
                default: 'not_attending'
            },
            attended: {
                type: Boolean,
                default: false
            }
        }]
    },
    // Common fields
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    imageUrl: {
        type: String
    }
});

// Update the updatedAt timestamp before saving
postSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to add a comment
postSchema.methods.addComment = async function(userId, content) {
    this.comments.push({
        author: userId,
        content: content
    });
    return this.save();
};

// Method to remove a comment
postSchema.methods.removeComment = async function(commentId) {
    this.comments = this.comments.filter(comment => comment._id.toString() !== commentId.toString());
    return this.save();
};

// Method to toggle like
postSchema.methods.toggleLike = async function(userId) {
    const index = this.likes.indexOf(userId);
    if (index === -1) {
        this.likes.push(userId);
    } else {
        this.likes.splice(index, 1);
    }
    return this.save();
};

// Method to update hangout attendance
postSchema.methods.updateAttendance = async function(userId, status) {
    if (this.type !== 'hangout') {
        throw new Error('This post is not a hangout');
    }

    const attendeeIndex = this.hangoutDetails.attendees.findIndex(
        attendee => attendee.user.toString() === userId.toString()
    );

    if (attendeeIndex === -1) {
        this.hangoutDetails.attendees.push({
            user: userId,
            status: status
        });
    } else {
        this.hangoutDetails.attendees[attendeeIndex].status = status;
    }

    return this.save();
};

// Method to mark attendance for a hangout
postSchema.methods.markAttendance = async function(userId, attended) {
    if (this.type !== 'hangout') {
        throw new Error('This post is not a hangout');
    }

    const attendee = this.hangoutDetails.attendees.find(
        attendee => attendee.user.toString() === userId.toString()
    );

    if (attendee) {
        attendee.attended = attended;
        return this.save();
    }

    throw new Error('User is not in the attendees list');
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post; 