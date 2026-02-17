const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    goals: String,
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'draft'],
        default: 'pending'
    },
    innovatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Structured Submission Sections
    sections: {
        problemStatement: String,
        objectives: String,
        proposedSolution: String,
        expectedImpact: String,
        additionalNotes: String
    },
    documents: [{
        name: String,
        url: String
    }],
    feedback: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        message: String,
        date: {
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
    }
});

module.exports = mongoose.model('Project', ProjectSchema);
