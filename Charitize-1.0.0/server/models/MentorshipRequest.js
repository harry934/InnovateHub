const mongoose = require('mongoose');

const MentorshipRequestSchema = new mongoose.Schema({
    innovatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'expired'],
        default: 'pending'
    },
    message: String,
    expiryDate: Date
}, { timestamps: true });

module.exports = mongoose.model('MentorshipRequest', MentorshipRequestSchema);
