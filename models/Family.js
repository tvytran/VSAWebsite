const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    totalPoints: {
        type: Number,
        default: 0
    },
    semesterPoints: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Method to update family points
familySchema.methods.updatePoints = async function(pointsToAdd) {
    this.totalPoints += pointsToAdd;
    this.semesterPoints += pointsToAdd;
    return this.save();
};

// Method to reset semester points
familySchema.methods.resetSemesterPoints = async function() {
    this.semesterPoints = 0;
    return this.save();
};

// Method to add member to family
familySchema.methods.addMember = async function(userId) {
    if (!this.members.includes(userId)) {
        this.members.push(userId);
        return this.save();
    }
    return this;
};

// Method to remove member from family
familySchema.methods.removeMember = async function(userId) {
    this.members = this.members.filter(member => member.toString() !== userId.toString());
    return this.save();
};

const Family = mongoose.model('Family', familySchema);

module.exports = Family; 