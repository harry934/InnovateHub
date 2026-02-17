const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['innovator', 'mentor', 'admin'],
        default: 'innovator'
    },
    profile: {
        bio: String,
        skills: [String],
        avatar: {
            type: String,
            default: 'assets/default-avatar.png' // Placeholder for default avatar
        },
        experience: String,
        availability: {
            type: Boolean,
            default: true
        }
    },
    onboardingCompleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
