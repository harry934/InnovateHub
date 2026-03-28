const mongoose = require('mongoose');

const InnovatorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    interests: [String],
    bio: String,
    projectsCount: {
        type: Number,
        default: 0
    },
    location: String
}, { timestamps: true });

module.exports = mongoose.model('Innovator', InnovatorSchema);
